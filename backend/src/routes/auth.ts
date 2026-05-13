import { Router, Request, Response } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { createOrUpdateUser } from '@/services/mongodb';

const router = Router();

router.post('/login', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { uid, displayName, email, photoURL } = req.body;
    const user = await createOrUpdateUser(uid, { displayName, email, photoURL });

    res.json({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
