import { Socket, Server as SocketIOServer } from 'socket.io';
import { verifyToken } from '@/services/firebase';
import { storeMessage, getMessages, setUserPresence, getActiveUsers } from '@/services/redis';
import { getUserByUID } from '@/services/mongodb';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userDisplayName?: string;
  userPhotoURL?: string;
}

export const setupSocketIO = (io: SocketIOServer) => {
  // Middleware for authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('No token provided'));
      }

      const decodedToken = await verifyToken(token);
      socket.userId = decodedToken.uid;

      // Fetch user from MongoDB
      const user = await getUserByUID(decodedToken.uid);
      if (user) {
        socket.userDisplayName = user.displayName;
        socket.userPhotoURL = user.photoURL;
      }

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const userName = socket.userDisplayName || 'Unknown';

    console.log(`User ${userName} (${userId}) connected. Socket ID: ${socket.id}`);

    // Emit AUTH system pulse
    socket.emit('system_pulse', {
      type: 'AUTH',
      message: `Token verified for ${userName} (UID: ${userId.substring(0, 8)}...)`,
      severity: 'info',
      timestamp: new Date().toLocaleTimeString(),
    });

    // Emit SOCKET system pulse
    socket.emit('system_pulse', {
      type: 'SOCKET',
      message: `User ${userName} joined private room.`,
      severity: 'info',
      timestamp: new Date().toLocaleTimeString(),
    });

    // Set user as active in Redis
    await setUserPresence(userId, 'active');

    // Broadcast presence update
    const activeUsers = await getActiveUsers();
    io.emit('presence', activeUsers);

    // Handle message sending
    socket.on('send_message', async (data: { recipient: string; content: string; sender: string }) => {
      try {
        const { recipient, content, sender } = data;
        const conversationKey = [sender, recipient].sort().join(':');

        // Store in Redis with TTL (default 2 minutes = 120 seconds)
        const ttl = parseInt(process.env.MESSAGE_TTL_SECONDS || '120', 10);
        await storeMessage(
          `chat:${conversationKey}`,
          {
            sender,
            senderName: socket.userDisplayName || 'Unknown',
            senderPhotoURL: socket.userPhotoURL,
            content,
            timestamp: new Date().toLocaleTimeString(),
          },
          ttl
        );

        // Emit REDIS system pulse
        socket.emit('system_pulse', {
          type: 'REDIS',
          message: `Key 'chat:${conversationKey.substring(0, 16)}...' created (TTL: ${ttl}s).`,
          severity: 'info',
          timestamp: new Date().toLocaleTimeString(),
        });

        // Emit message to recipient using a private room
        const recipientSocket = Array.from(io.sockets.sockets.values()).find(
          (s: any) => s.userId === recipient
        ) as AuthenticatedSocket | undefined;

        if (recipientSocket) {
          recipientSocket.emit('message', {
            sender,
            senderName: socket.userDisplayName || 'Unknown',
            senderPhotoURL: socket.userPhotoURL,
            content,
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${userName} (${userId}) disconnected`);

      // Remove presence
      await setUserPresence(userId, 'offline');

      // Emit SOCKET system pulse
      socket.emit('system_pulse', {
        type: 'SOCKET',
        message: `User ${userName} disconnected.`,
        severity: 'warning',
        timestamp: new Date().toLocaleTimeString(),
      });

      // Broadcast presence update
      const activeUsers = await getActiveUsers();
      io.emit('presence', activeUsers);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${userId}:`, error);
      socket.emit('system_pulse', {
        type: 'SOCKET',
        message: `Error: ${error}`,
        severity: 'error',
        timestamp: new Date().toLocaleTimeString(),
      });
    });
  });
};

export default setupSocketIO;
