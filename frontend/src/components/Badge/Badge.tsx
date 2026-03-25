/**
 * Badge Component
 *
 * Status and label badges
 */

'use client';

import { HTMLAttributes, forwardRef } from 'react';
import styles from './Badge.module.css';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        className={`${styles.badge} ${styles[variant]} ${styles[size]} ${dot ? styles.withDot : ''} ${className}`}
        {...props}
      >
        {dot && <span className={styles.dot} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge variant
export type StatusType = 'online' | 'offline' | 'busy' | 'inactive';

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'dot'> {
  status: StatusType;
}

const statusVariantMap: Record<StatusType, BadgeVariant> = {
  online: 'success',
  offline: 'default',
  busy: 'error',
  inactive: 'default',
};

const statusLabelMap: Record<StatusType, string> = {
  online: 'Online',
  offline: 'Offline',
  busy: 'Busy',
  inactive: 'Inactive',
};

export function StatusBadge({ status, size = 'md', className = '', ...props }: StatusBadgeProps) {
  return (
    <Badge variant={statusVariantMap[status]} size={size} dot className={className} {...props}>
      {statusLabelMap[status]}
    </Badge>
  );
}

export { Badge };
