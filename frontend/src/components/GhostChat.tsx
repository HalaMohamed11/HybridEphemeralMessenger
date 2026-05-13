'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@/hooks/useMessaging';
import { decryptMessage } from '@/lib/encryption';
import styles from '@/styles/GhostChat.module.css';

interface GhostChatProps {
  messages: Message[];
  currentUserUID: string | null;
  selectedUser: string | null;
  onSendMessage: (content: string) => void;
  onlineUsers: Array<{ uid: string; displayName: string; status: 'active' | 'offline' }>;
}

export const GhostChat: React.FC<GhostChatProps> = ({
  messages,
  currentUserUID,
  selectedUser,
  onSendMessage,
  onlineUsers,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && selectedUser) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const selectedUserData = onlineUsers.find((u) => u.uid === selectedUser);
  const getUserName = (uid: string) => {
    const user = onlineUsers.find((u) => u.uid === uid);
    return user?.displayName || uid;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {selectedUser ? (
          <div className={styles.selectedUserInfo}>
            <span className={styles.userName}>{selectedUserData?.displayName || selectedUser}</span>
            <span className={`${styles.status} ${selectedUserData?.status === 'active' ? styles.active : styles.offline}`}>
              ● {selectedUserData?.status || 'offline'}
            </span>
          </div>
        ) : (
          <span className={styles.noSelection}>Select a user to start chatting</span>
        )}
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            {selectedUser ? 'No messages yet. Start a conversation!' : 'Select a user to view messages'}
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`${styles.message} ${msg.sender === currentUserUID ? styles.sent : styles.received}`}>
              <span className={styles.label}>
                [{msg.sender === currentUserUID ? 'You' : getUserName(msg.sender)}]
              </span>
              <span className={styles.content}>
                {msg.encrypted ? decryptMessage(msg.content) : msg.content}
              </span>
              <span className={styles.timestamp}>{msg.timestamp}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {selectedUser && (
        <form onSubmit={handleSendMessage} className={styles.inputForm}>
          <div className={styles.inputWrapper}>
            <span className={styles.prompt}>{'> '}</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type message..."
              className={styles.input}
              disabled={!selectedUser}
            />
          </div>
          <button type="submit" className={styles.sendBtn} disabled={!inputValue.trim() || !selectedUser}>
            Send
          </button>
        </form>
      )}
    </div>
  );
};
