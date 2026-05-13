'use client';

import React from 'react';
import { AuthUser } from '@/hooks/useAuth';
import styles from '@/styles/Auth.module.css';

interface AuthPaneProps {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  mfaRequired?: boolean;
  onLogin: () => Promise<any>;
  onLogout: () => Promise<void>;
  onVerifyOTP?: (otp: string) => Promise<void>;
}

export const AuthPane: React.FC<AuthPaneProps> = ({ 
  user, 
  loading, 
  error, 
  mfaRequired, 
  onLogin, 
  onLogout,
  onVerifyOTP 
}) => {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [otp, setOtp] = React.useState('');
  const [isVerifying, setIsVerifying] = React.useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await onLogin();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying || !onVerifyOTP) return;
    setIsVerifying(true);
    try {
      await onVerifyOTP(otp);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Initializing...</div>
      </div>
    );
  }

  if (mfaRequired && onVerifyOTP) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>OTP VERIFICATION</h1>
          <p className={styles.subtitle}>Enter the 6-digit code dispatched to your account</p>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleVerify} className={styles.otpForm}>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="000000"
              maxLength={6}
              className={styles.otpInput}
              autoFocus
            />
            <button type="submit" disabled={isVerifying || otp.length !== 6} className={styles.loginBtn}>
              {isVerifying ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>GHOST PROTOCOL</h1>
          <p className={styles.subtitle}>Ephemeral Messaging Platform</p>
          {error && <div className={styles.error}>{error}</div>}
          <button onClick={handleLogin} disabled={isLoggingIn} className={styles.loginBtn}>
            {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.userBox}>
        {user.photoURL && <img src={user.photoURL} alt={user.displayName || 'User'} className={styles.avatar} />}
        <div className={styles.userInfo}>
          <span className={styles.name}>{user.displayName}</span>
          <span className={styles.email}>{user.email}</span>
        </div>
        <button onClick={onLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </div>
  );
};
