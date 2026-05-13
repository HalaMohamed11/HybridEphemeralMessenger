import { Router, Request, Response } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { createOrUpdateUser } from '@/services/mongodb';
import { setPendingMFA, getPendingMFA, deletePendingMFA } from '@/services/redis';
import crypto from 'crypto';

const router = Router();

router.post('/login', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { uid, displayName, email, photoURL } = req.body;
    
    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Store in Redis with PENDING_MFA state
    await setPendingMFA(sessionToken, { uid, displayName, email, photoURL, otp });

    // "Dispatch" OTP - in this demo we log it to console as if it was sent via SMS/Email
    console.log(`[OTP DISPATCH] User: ${email}, OTP: ${otp}`);

    res.json({
      mfaRequired: true,
      sessionToken,
      message: 'OTP dispatched to registered channel'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { sessionToken, otp } = req.body;
    const pendingData = await getPendingMFA(sessionToken);

    if (!pendingData) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    if (pendingData.otp !== otp) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // OTP verified, create/update user in DB
    const { uid, displayName, email, photoURL } = pendingData;
    const user = await createOrUpdateUser(uid, { displayName, email, photoURL });

    // Clean up Redis
    await deletePendingMFA(sessionToken);

    res.json({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

export default router;
