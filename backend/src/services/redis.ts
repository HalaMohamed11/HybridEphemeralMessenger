import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;

export const initRedis = async () => {
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  redisClient.on('error', (err: Error) => console.error('Redis error:', err));
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
    return messages.map((msg: string) => JSON.parse(msg));
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return [];
  }
};

export const fetchAndDeleteMessages = async (conversationKey: string) => {
  try {
    const multi = redisClient.multi();
    multi.lRange(conversationKey, 0, -1);
    multi.del(conversationKey);
    const [messages] = await multi.exec() as [string[], any];
    return messages.map((msg: string) => JSON.parse(msg));
  } catch (error) {
    console.error('Error in fetchAndDeleteMessages:', error);
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

export const setPendingMFA = async (sessionToken: string, data: any, ttlSeconds: number = 300) => {
  try {
    await redisClient.setEx(`PENDING_MFA:${sessionToken}`, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.error('Error setting pending MFA:', error);
  }
};

export const getPendingMFA = async (sessionToken: string) => {
  try {
    const data = await redisClient.get(`PENDING_MFA:${sessionToken}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting pending MFA:', error);
    return null;
  }
};

export const deletePendingMFA = async (sessionToken: string) => {
  try {
    await redisClient.del(`PENDING_MFA:${sessionToken}`);
  } catch (error) {
    console.error('Error deleting pending MFA:', error);
  }
};

export const getActiveUsers = async () => {
  try {
    const keys = await redisClient.keys('presence:*');
    return keys.map((key: string) => key.replace('presence:', ''));
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
