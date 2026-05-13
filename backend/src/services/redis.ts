import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;

export const initRedis = async () => {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err) => console.error('Redis error:', err));
  redisClient.on('connect', () => console.log('Redis connected'));

  await redisClient.connect();
  return redisClient;
};

export const getRedis = () => redisClient;

export const storeMessage = async (
  conversationKey: string,
  message: {
    sender: string;
    senderName: string;
    senderPhotoURL?: string;
    content: string;
    timestamp: string;
  },
  ttlSeconds: number = 120
) => {
  try {
    await redisClient.rPush(conversationKey, JSON.stringify(message));
    await redisClient.expire(conversationKey, ttlSeconds);
    return true;
  } catch (error) {
    console.error('Error storing message:', error);
    throw error;
  }
};

export const getMessages = async (conversationKey: string) => {
  try {
    const messages = await redisClient.lRange(conversationKey, 0, -1);
    return messages.map((msg) => JSON.parse(msg));
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return [];
  }
};

export const deleteMessages = async (conversationKey: string) => {
  try {
    await redisClient.del(conversationKey);
  } catch (error) {
    console.error('Error deleting messages:', error);
  }
};

export const setUserPresence = async (uid: string, status: 'active' | 'offline') => {
  try {
    if (status === 'active') {
      await redisClient.setEx(`presence:${uid}`, 3600, JSON.stringify({ status: 'active' }));
    } else {
      await redisClient.del(`presence:${uid}`);
    }
  } catch (error) {
    console.error('Error setting presence:', error);
  }
};

export const getActiveUsers = async () => {
  try {
    const keys = await redisClient.keys('presence:*');
    return keys.map((key) => key.replace('presence:', ''));
  } catch (error) {
    console.error('Error getting active users:', error);
    return [];
  }
};

export const subscribeToKeyspaceNotifications = async () => {
  try {
    const subscriber = redisClient.duplicate();
    await subscriber.connect();
    await subscriber.configSet('notify-keyspace-events', 'Ex');
    return subscriber;
  } catch (error) {
    console.error('Error subscribing to keyspace notifications:', error);
  }
};
