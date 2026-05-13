import { useState, useCallback, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { initSocket, getSocket, disconnectSocket } from '@/lib/socket';
import { encryptMessage, decryptMessage } from '@/lib/encryption';

export interface SystemPulseEvent {
  timestamp: string;
  type: 'AUTH' | 'SOCKET' | 'REDIS' | 'GHOST' | 'PRESENCE' | 'TWILIO';
  message: string;
  severity?: 'info' | 'warning' | 'error';
}

export interface Message {
  sender: string;
  senderName: string;
  senderPhotoURL?: string;
  content: string;
  timestamp: string;
  encrypted?: boolean;
}

export interface PresenceUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  status: 'active' | 'offline';
}

export const useMessaging = (userToken: string | null, currentUserUID: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemPulse, setSystemPulse] = useState<SystemPulseEvent[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSystemPulse = useCallback((type: SystemPulseEvent['type'], message: string, severity?: 'info' | 'warning' | 'error') => {
    const event: SystemPulseEvent = {
      type,
      message,
      severity,
      timestamp: new Date().toLocaleTimeString(),
    };
    setSystemPulse((prev) => [...prev, event]);
  }, []);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!userToken || !currentUserUID) return;

    try {
      const newSocket = initSocket(userToken);
      setSocket(newSocket);
      setLoading(true);

      const handleBeforeUnload = () => {
        newSocket.emit('manual_disconnect');
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      newSocket.on('connect', () => {
        console.log('Socket connected');
        addSystemPulse('SOCKET', `Connected to messaging server (Socket ID: ${newSocket.id})`, 'info');
        setLoading(false);
      });

      newSocket.on('message', (message: Message) => {
        // Decrypt incoming message
        const decryptedContent = decryptMessage(message.content);
        setMessages((prev) => [...prev, { ...message, content: decryptedContent }]);
      });

      newSocket.on('system_pulse', (event: SystemPulseEvent) => {
        addSystemPulse(event.type, event.message, event.severity);
      });

      newSocket.on('wipe', () => {
        console.log('Chat wiped - TTL expired');
        setMessages([]);
        addSystemPulse('GHOST', 'TTL reached 0. Redis memory purged.', 'warning');
      });

      newSocket.on('presence', (users: PresenceUser[]) => {
        setOnlineUsers(users);
      });

      newSocket.on('error', (err: any) => {
        const errorMsg = typeof err === 'string' ? err : err?.message || 'Socket error';
        setError(errorMsg);
        addSystemPulse('SOCKET', `Error: ${errorMsg}`, 'error');
      });

      newSocket.on('disconnect', () => {
        addSystemPulse('SOCKET', 'Disconnected from messaging server', 'warning');
      });

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        newSocket.disconnect();
        disconnectSocket();
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to messaging';
      setError(errorMessage);
      setLoading(false);
    }
  }, [userToken, currentUserUID, addSystemPulse]);

  const sendMessage = useCallback(
    async (recipientUID: string, content: string) => {
      if (!socket || !currentUserUID) return;

      try {
        const encryptedContent = encryptMessage(content);
        socket.emit('send_message', {
          recipient: recipientUID,
          content: encryptedContent,
          sender: currentUserUID,
        });

        // Add local message (plain text for sender's view, or show encrypted if preferred)
        const message: Message = {
          sender: currentUserUID,
          senderName: 'You',
          content: content,
          timestamp: new Date().toLocaleTimeString(),
        };

        setMessages((prev) => [...prev, message]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
      }
    },
    [socket, currentUserUID]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  const selectUser = useCallback((uid: string | null) => {
    setSelectedUser(uid);
    setMessages([]);
    if (uid && socket && currentUserUID) {
      socket.emit('fetch_history', { recipient: uid, sender: currentUserUID });
    }
  }, [socket, currentUserUID]);

  // Listen for history
  useEffect(() => {
    if (!socket) return;

    socket.on('history', (historyMessages: Message[]) => {
      const decryptedMessages = historyMessages.map(msg => ({
        ...msg,
        content: decryptMessage(msg.content)
      }));
      setMessages(decryptedMessages);
    });

    return () => {
      socket.off('history');
    };
  }, [socket]);

  return {
    socket,
    messages,
    systemPulse,
    onlineUsers,
    selectedUser,
    loading,
    error,
    sendMessage,
    clearChat,
    selectUser,
    addSystemPulse,
  };
};
