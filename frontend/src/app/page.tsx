/**
 * AI-WorkHub - Main Dashboard Page
 *
 * Entry point for the AI WorkHub platform
 */

'use client';

import { motion } from 'framer-motion';
import { Users, UsersRound, ListTodo, MessageSquare, FolderOpen, Activity, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import styles from './page.module.css';

// Mock data for dashboard
const stats = [
  { label: 'Employees', value: 3, icon: Users, color: '#6366f1', href: '/employees' },
  { label: 'Teams', value: 2, icon: UsersRound, color: '#8b5cf6', href: '/teams' },
  { label: 'Active Tasks', value: 5, icon: ListTodo, color: '#22c55e', href: '/tasks' },
  { label: 'Conversations', value: 8, icon: MessageSquare, color: '#f59e0b', href: '/conversations' },
];

const recentActivities = [
  { id: 1, text: 'Alice completed task "API Documentation"', time: '2 min ago', type: 'task' },
  { id: 2, text: 'New conversation started in Team Alpha', time: '15 min ago', type: 'chat' },
  { id: 3, text: 'Bob joined Team Backend', time: '1 hour ago', type: 'team' },
  { id: 4, text: 'Reflection generated for Alice', time: '2 hours ago', type: 'memory' },
];

export default function DashboardPage() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <Badge variant="primary" size="sm">v0.1.0</Badge>
        </div>
      </header>

      {/* Dashboard content */}
      <div className={styles.content}>
        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={stat.href} className={styles.statLink}>
                <Card hover className={styles.statCard}>
                  <CardContent>
                    <div className={styles.statContent}>
                      <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                        <stat.icon size={24} />
                      </div>
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stat.value}</span>
                        <span className={styles.statLabel}>{stat.label}</span>
                      </div>
                      <ArrowRight size={16} className={styles.statArrow} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className={styles.mainGrid}>
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader title="Recent Activity" subtitle="Latest actions across your workspace" />
              <CardContent>
                <div className={styles.activityList}>
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className={styles.activityItem}>
                      <div className={styles.activityDot} />
                      <div className={styles.activityContent}>
                        <span className={styles.activityText}>{activity.text}</span>
                        <span className={styles.activityTime}>{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader title="Quick Actions" subtitle="Common tasks and shortcuts" />
              <CardContent>
                <div className={styles.quickActions}>
                  <Link href="/employees" className={styles.quickActionLink}>
                    <Button variant="secondary" size="sm" fullWidth>
                      <Users size={16} />
                      Manage Employees
                    </Button>
                  </Link>
                  <Link href="/teams" className={styles.quickActionLink}>
                    <Button variant="secondary" size="sm" fullWidth>
                      <UsersRound size={16} />
                      Manage Teams
                    </Button>
                  </Link>
                  <Link href="/tasks" className={styles.quickActionLink}>
                    <Button variant="secondary" size="sm" fullWidth>
                      <ListTodo size={16} />
                      View Tasks
                    </Button>
                  </Link>
                  <Link href="/conversations" className={styles.quickActionLink}>
                    <Button variant="secondary" size="sm" fullWidth>
                      <MessageSquare size={16} />
                      Open Chat
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader title="System Status" subtitle="AI agent health and activity" />
            <CardContent>
              <div className={styles.systemStatus}>
                <div className={styles.statusItem}>
                  <div className={styles.statusHeader}>
                    <span className={styles.statusDot} style={{ backgroundColor: '#22c55e' }} />
                    <span>Alice (Backend Engineer)</span>
                  </div>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusHeader}>
                    <span className={styles.statusDot} style={{ backgroundColor: '#22c55e' }} />
                    <span>Bob (Frontend Developer)</span>
                  </div>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
                <div className={styles.statusItem}>
                  <div className={styles.statusHeader}>
                    <span className={styles.statusDot} style={{ backgroundColor: '#6b7280' }} />
                    <span>Carol (Product Manager)</span>
                  </div>
                  <Badge variant="default" size="sm">Idle</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
