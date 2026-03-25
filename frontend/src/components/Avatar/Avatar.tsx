/**
 * Avatar Component
 *
 * User/agent avatar with fallback
 */

'use client';

import { HTMLAttributes, forwardRef, useState } from 'react';
import styles from './Avatar.module.css';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name?: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy' | 'inactive';
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return words.map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f43f5e', // rose
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#3b82f6', // blue
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      name = '',
      size = 'md',
      status,
      className = '',
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const showImage = src && !imageError;
    const initials = getInitials(name || '?');
    const bgColor = getColorFromName(name || 'Anonymous');

    return (
      <div
        ref={ref}
        className={`${styles.avatar} ${styles[size]} ${className}`}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={name}
            className={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={styles.initials} style={{ backgroundColor: bgColor }}>
            {initials}
          </span>
        )}

        {status && (
          <span className={`${styles.status} ${styles[`status-${status}`]}`} />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group for showing multiple avatars
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  avatars: Array<{ src?: string | null; name?: string }>;
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({
  avatars,
  max = 4,
  size = 'md',
  className = '',
  ...props
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={`${styles.group} ${className}`} {...props}>
      {visible.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          size={size}
        />
      ))}
      {remaining > 0 && (
        <div className={`${styles.avatar} ${styles[size]} ${styles.remaining}`}>
          <span className={styles.initials}>+{remaining}</span>
        </div>
      )}
    </div>
  );
}

export { Avatar };
