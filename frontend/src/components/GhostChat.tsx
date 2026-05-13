'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@/hooks/useMessaging';
import { Avatar } from '@/components/Avatar';
import styles from '@/styles/GhostChat.module.css';

interface GhostChatProps {
  messages: Message[];
  currentUserUID: string | null;
  selectedUser: string | null;
  onSendMessage: (content: string) => void;
  onlineUsers: Array<{ uid: string; displayName: string; photoURL?: string; status: 'active' | 'offline' }>;
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
  const getUser = (uid: string) => onlineUsers.find((u) => u.uid === uid);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        {selectedUser ? (
          <div className={styles.selectedUserInfo}>
            <Avatar src={selectedUserData?.photoURL} alt={selectedUserData?.displayName} size={26} className={styles.headerAvatar} />
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
          messages.map((msg, idx) => {
            const isSent = msg.sender === currentUserUID;
            const senderUser = isSent ? null : getUser(msg.sender);
            const photoURL = isSent ? null : (msg.senderPhotoURL || senderUser?.photoURL);
            const name = isSent ? 'You' : (senderUser?.displayName || msg.senderName || msg.sender);
            return (
              <div key={idx} className={`${styles.message} ${isSent ? styles.sent : styles.received}`}>
                {!isSent && <Avatar src={photoURL} alt={name} size={22} className={styles.msgAvatar} />}
                <div className={styles.msgBody}>
                  <span className={styles.label}>[{name}]</span>
                  <span className={styles.content}>{msg.content}</span>
                </div>
                <span className={styles.timestamp}>{msg.timestamp}</span>
              </div>
            );
          })
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
