/**
 * Card Component
 *
 * Card-based container with hover effects
 */

'use client';

import { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import styles from './Card.module.css';

export interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: React.ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={`${styles.card} ${styles[variant]} ${styles[`padding-${padding}`]} ${hover ? styles.hoverable : ''} ${className}`}
        whileHover={hover ? { y: -2, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)' } : undefined}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function CardHeader({ title, subtitle, action, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={`${styles.header} ${className}`} {...props}>
      <div className={styles.headerContent}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {action && <div className={styles.headerAction}>{action}</div>}
    </div>
  );
}

// Card Content
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export function CardContent({ children, className = '', ...props }: CardContentProps) {
  return (
    <div className={`${styles.content} ${className}`} {...props}>
      {children}
    </div>
  );
}

// Card Footer
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

export function CardFooter({ children, className = '', ...props }: CardFooterProps) {
  return (
    <div className={`${styles.footer} ${className}`} {...props}>
      {children}
    </div>
  );
}

export { Card };
