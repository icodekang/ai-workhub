/**
 * Sidebar Navigation Component
 *
 * Main app navigation with sidebar
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  Users,
  UsersRound,
  ListTodo,
  MessageSquare,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/', icon: Activity, label: 'Dashboard' },
  { href: '/employees', icon: Users, label: 'Employees' },
  { href: '/teams', icon: UsersRound, label: 'Teams' },
  { href: '/tasks', icon: ListTodo, label: 'Tasks' },
  { href: '/conversations', icon: MessageSquare, label: 'Conversations' },
  { href: '/work-products', icon: FolderOpen, label: 'Work Products' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Activity size={24} />
        </div>
        {!collapsed && <span className={styles.logoText}>AI-WorkHub</span>}
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <item.icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <Link href="/settings" className={styles.navItem}>
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </Link>

        <button className={styles.toggleButton} onClick={onToggle}>
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </aside>
  );
}
