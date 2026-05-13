import axios from 'axios';
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

async function runSmokeTest() {
  console.log('🚀 Starting E2E Smoke Test...');

  // 1. Check Backend Health
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    console.log('✅ Backend is reachable');
  } catch (err: any) {
    if (err.response?.status === 404) {
       console.log('✅ Backend is reachable (404 on /health is fine if not implemented)');
    } else {
       console.error('❌ Backend is unreachable:', err.message);
    }
  }

  // 2. Check Redis Connection
  const redisClient = createClient({ url: REDIS_URL });
  try {
    await redisClient.connect();
    console.log('✅ Redis is reachable');
    await redisClient.disconnect();
  } catch (err: any) {
    console.error('❌ Redis is unreachable:', err.message);
  }

  // 3. Test Auth Endpoint
  try {
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      uid: 'smoke-test-uid',
      displayName: 'Smoke Tester',
      email: 'smoke@test.com'
    });
    
    if (response.data.mfaRequired && response.data.sessionToken) {
      console.log('✅ MFA Logic is active (OTP dispatched)');
    } else {
      console.error('❌ MFA Logic failed to trigger');
    }
  } catch (err: any) {
    // Expected to fail if no Firebase token is provided in headers
    if (err.response?.status === 401 || err.response?.status === 403) {
      console.log('✅ Auth Endpoint is protected (Middleware working)');
    } else {
      console.error('❌ Auth Endpoint error:', err.message);
    }
  }

  console.log('🏁 Smoke Test Completed.');
}

runSmokeTest();
