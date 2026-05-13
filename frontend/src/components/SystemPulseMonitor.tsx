'use client';

import React, { useEffect, useRef } from 'react';
import { SystemPulseEvent } from '@/hooks/useMessaging';
import styles from '@/styles/SystemPulse.module.css';

interface SystemPulseProps {
  events: SystemPulseEvent[];
}

export const SystemPulseMonitor: React.FC<SystemPulseProps> = ({ events }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>SYSTEM PULSE MONITOR</span>
        <span className={styles.eventCount}>[{events.length} events]</span>
      </div>
      <div className={styles.eventsContainer}>
        {events.length === 0 ? (
          <div className={styles.placeholder}>Awaiting system events...</div>
        ) : (
          events.map((event, idx) => (
            <div key={idx} className={`${styles.event} ${styles[event.severity || 'info']}`}>
              <span className={styles.bracket}>[</span>
              <span className={styles.type}>{event.type}</span>
              <span className={styles.bracket}>]</span>
              <span className={styles.timestamp}>{event.timestamp}</span>
              <span className={styles.message}>{event.message}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
