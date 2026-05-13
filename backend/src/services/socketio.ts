import { Socket, Server as SocketIOServer } from 'socket.io';
import { verifyToken } from '@/services/firebase';
import { storeMessage, fetchAndDeleteMessages, setUserPresence, getActiveUsers, subscribeToKeyspaceNotifications } from '@/services/redis';
import { getUserByUID } from '@/services/mongodb';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userDisplayName?: string;
  userPhotoURL?: string;
}

export const setupSocketIO = async (io: SocketIOServer) => {
  // Middleware for authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('No token provided'));
      }

      const decodedToken = await verifyToken(token);
      socket.userId = decodedToken.uid;

      // Fetch user from MongoDB, fall back to Firebase token fields
      const user = await getUserByUID(decodedToken.uid);
      socket.userDisplayName = user?.displayName || (decodedToken as any).name || 'Unknown';
      socket.userPhotoURL = user?.photoURL || (decodedToken as any).picture;

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
      message: `MFA Verified. Session promoted to SECURE.`,
      severity: 'info',
      timestamp: new Date().toLocaleTimeString(),
    });

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

    // Set user as active in Redis (include display info for presence broadcasts)
    await setUserPresence(userId, 'active', {
      displayName: socket.userDisplayName,
      photoURL: socket.userPhotoURL,
    });

    // Broadcast updated presence list to all connected sockets (including this one)
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

    // Handle fetching history (Fetch + Delete for ephemerality)
    socket.on('fetch_history', async (data: { recipient: string; sender: string }) => {
      try {
        const { recipient, sender } = data;
        const conversationKey = [sender, recipient].sort().join(':');
        const key = `chat:${conversationKey}`;

        const messages = await fetchAndDeleteMessages(key);

        socket.emit('history', messages);

        // Emit REDIS system pulse
        socket.emit('system_pulse', {
          type: 'REDIS',
          message: `MULTI/EXEC fetch+delete on '${key.substring(0, 16)}...'. History purged.`,
          severity: 'warning',
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    });

    // Handle manual disconnect for instant presence wipe
    socket.on('manual_disconnect', async () => {
      console.log(`User ${userName} (${userId}) manually disconnected.`);
      await setUserPresence(userId, 'offline');
      
      socket.emit('system_pulse', {
        type: 'SOCKET',
        message: `User ${userName} manual wipe requested.`,
        severity: 'warning',
        timestamp: new Date().toLocaleTimeString(),
      });

      const activeUsers = await getActiveUsers();
      io.emit('presence', activeUsers);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${userName} (${userId}) disconnected`);

      // Remove presence if not already removed by manual_disconnect
      await setUserPresence(userId, 'offline');

      // Emit SOCKET system pulse
      socket.emit('system_pulse', {
        type: 'SOCKET',
        message: `User ${userName} connection closed.`,
        severity: 'warning',
        timestamp: new Date().toLocaleTimeString(),
      });

      // Broadcast presence update
      const activeUsers = await getActiveUsers();
      io.emit('presence', activeUsers);
    });

    socket.on('error', (error: any) => {
      console.error(`Socket error for ${userId}:`, error);
      socket.emit('system_pulse', {
        type: 'SOCKET',
        message: `Error: ${error}`,
        severity: 'error',
        timestamp: new Date().toLocaleTimeString(),
      });
    });
  });

  // Subscribe to Redis keyspace notifications to detect TTL expiry on chat keys
  const subscriber = await subscribeToKeyspaceNotifications();
  if (subscriber) {
    await subscriber.subscribe('__keyevent@0__:expired', (expiredKey: string) => {
      if (!expiredKey.startsWith('chat:')) return;

      const uids = expiredKey.replace('chat:', '').split(':');

      // Notify every connected socket that belongs to either user in the conversation
      io.sockets.sockets.forEach((s) => {
        const authSocket = s as AuthenticatedSocket;
        if (authSocket.userId && uids.includes(authSocket.userId)) {
          authSocket.emit('wipe');
          authSocket.emit('system_pulse', {
            type: 'GHOST',
            message: `TTL reached 0. Redis memory purged. Sending WIPE signal...`,
            severity: 'warning',
            timestamp: new Date().toLocaleTimeString(),
          });
        }
      });
    });
  }
};

export default setupSocketIO;
