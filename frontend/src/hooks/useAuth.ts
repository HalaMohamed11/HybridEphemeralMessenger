import { useEffect, useState, useCallback } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  idToken: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMFA, setPendingMFA] = useState<{ sessionToken: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        if (!pendingMFA) {
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            idToken,
          });
        }
      } else {
        setUser(null);
        setPendingMFA(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pendingMFA]);

  const login = useCallback(async () => {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
      });

      let result;
      try {
        result = await signInWithPopup(auth, provider);
      } catch (popupErr: any) {
        if (popupErr.code === 'auth/popup-blocked') {
          throw new Error('Popup was blocked. Please allow popups for this site.');
        } else if (popupErr.code === 'auth/cancelled-popup-request') {
          throw new Error('Sign-in cancelled. Please try again.');
        } else if (popupErr.code === 'auth/internal-error') {
          throw new Error('Firebase error. Check that Google Sign-In is enabled in Firebase Console.');
        }
        throw popupErr;
      }

      const idToken = await result.user.getIdToken();

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
        }),
      });

      if (!response.ok) {
        throw new Error('Backend authentication failed');
      }

      const data = await response.json();

      if (data.mfaRequired) {
        setPendingMFA({ sessionToken: data.sessionToken });
        return { mfaRequired: true };
      }

      const newUser: AuthUser = {
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        idToken,
      };

      setUser(newUser);
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
    }
  }, []);

  const verifyOTP = useCallback(async (otp: string) => {
    try {
      if (!pendingMFA) throw new Error('No pending MFA session');
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken: pendingMFA.sessionToken,
          otp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OTP verification failed');
      }

      const backendUser = await response.json();
      const currentUser = auth.currentUser;
      const idToken = currentUser ? await currentUser.getIdToken() : null;

      const newUser: AuthUser = {
        uid: backendUser.uid,
        email: backendUser.email,
        displayName: backendUser.displayName,
        photoURL: backendUser.photoURL,
        idToken,
      };

      setUser(newUser);
      setPendingMFA(null);
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'OTP verification failed';
      setError(errorMessage);
      throw err;
    }
  }, [pendingMFA]);

  const logout = useCallback(async () => {
    try {
      setError(null);
      await signOut(auth);
      setUser(null);
      setPendingMFA(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw err;
    }
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    verifyOTP,
    mfaRequired: !!pendingMFA,
    isAuthenticated: !!user,
  };
};
