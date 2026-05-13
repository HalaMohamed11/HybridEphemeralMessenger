'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMessaging } from '@/hooks/useMessaging';
import { AuthPane } from '@/components/AuthPane';
import { GhostChat } from '@/components/GhostChat';
import { SystemPulseMonitor } from '@/components/SystemPulseMonitor';
import { PresenceTracker } from '@/components/PresenceTracker';
import styles from '@/styles/index.module.css';

export default function Home() {
  const { user, loading: authLoading, error: authError, login, logout } = useAuth();
  const {
    messages,
    systemPulse,
    onlineUsers,
    selectedUser,
    loading: messagingLoading,
    error: messagingError,
    sendMessage,
    selectUser,
  } = useMessaging(user?.idToken || null, user?.uid || null);

  // If not authenticated, show auth pane
  if (!user) {
    return <AuthPane user={user} loading={authLoading} error={authError} onLogin={login} onLogout={logout} />;
  }

  return (
    <div className={styles.mainLayout}>
      {/* Left: Auth Pane */}
      <div className={styles.authSection}>
        <AuthPane user={user} loading={authLoading} error={authError} onLogin={login} onLogout={logout} />
      </div>

      {/* Center: Presence Tracker */}
      <div className={styles.presenceSection}>
        <PresenceTracker
          onlineUsers={onlineUsers}
          selectedUser={selectedUser}
          onSelectUser={selectUser}
          currentUserUID={user.uid}
        />
      </div>

      {/* Right: Chat Section */}
      <div className={styles.chatSection}>
        {/* Ghost Chat Pane */}
        <div className={styles.ghostChatPane}>
          <GhostChat
            messages={messages}
            currentUserUID={user.uid}
            selectedUser={selectedUser}
            onSendMessage={(content) => {
              if (selectedUser) {
                sendMessage(selectedUser, content);
              }
            }}
            onlineUsers={onlineUsers}
          />
        </div>

        {/* System Pulse Monitor */}
        <div className={styles.pulseSection}>
          <SystemPulseMonitor events={systemPulse} />
        </div>

        {/* Status Bar */}
        <div className={styles.statusBar}>
          <span className={styles.statusMessage}>
            {messagingError ? `Error: ${messagingError}` : `Users online: ${onlineUsers.length}`}
          </span>
          <div className={`${styles.statusIndicator} ${messagingLoading ? 'disconnected' : 'connected'}`} />
        </div>
      </div>
    </div>
  );
}
