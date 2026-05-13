'use client';

import React from 'react';
import { AuthUser } from '@/hooks/useAuth';
import styles from '@/styles/Auth.module.css';

interface AuthPaneProps {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export const AuthPane: React.FC<AuthPaneProps> = ({ user, loading, error, onLogin, onLogout }) => {
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await onLogin();
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Initializing...</div>
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
