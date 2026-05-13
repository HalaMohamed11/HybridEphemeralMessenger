'use client';

import React from 'react';
import { Avatar } from '@/components/Avatar';
import styles from '@/styles/PresenceTracker.module.css';

interface PresenceTrackerProps {
  onlineUsers: Array<{ uid: string; displayName: string; status: 'active' | 'offline'; photoURL?: string }>;
  selectedUser: string | null;
  onSelectUser: (uid: string) => void;
  currentUserUID: string | null;
}

export const PresenceTracker: React.FC<PresenceTrackerProps> = ({
  onlineUsers,
  selectedUser,
  onSelectUser,
  currentUserUID,
}) => {
  const otherUsers = onlineUsers.filter((u) => u.uid !== currentUserUID);

  return (
    <div className={styles.container}>
      <div className={styles.header}>ACTIVE USERS</div>
      <div className={styles.usersList}>
        {otherUsers.length === 0 ? (
          <div className={styles.noUsers}>No other users online</div>
        ) : (
          otherUsers.map((user) => (
            <div
              key={user.uid}
              className={`${styles.userItem} ${selectedUser === user.uid ? styles.selected : ''}`}
              onClick={() => onSelectUser(user.uid)}
            >
              <Avatar src={user.photoURL} alt={user.displayName} size={28} className={styles.avatar} />
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user.displayName}</div>
                <span className={`${styles.status} ${user.status === 'active' ? styles.active : styles.offline}`}>
                  ● {user.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
