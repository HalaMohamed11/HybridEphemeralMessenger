import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  alt?: string | null;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 32, className }) => {
  const [failed, setFailed] = useState(false);
  const initial = alt ? alt.charAt(0).toUpperCase() : '?';

  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    objectFit: 'cover',
  };

  const fallbackStyle: React.CSSProperties = {
    ...style,
    background: '#2e2e2e',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888888',
    fontSize: Math.round(size * 0.4),
    fontFamily: 'Monaco, monospace',
    fontWeight: 'bold',
    userSelect: 'none',
  };

  if (!src || failed) {
    return (
      <div style={fallbackStyle} className={className}>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ''}
      style={style}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
};
