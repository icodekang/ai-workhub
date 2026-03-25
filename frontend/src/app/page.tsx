/**
 * AI-WorkHub - Main Dashboard Page
 *
 * Entry point for the AI WorkHub platform
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UsersRound,
  ListTodo,
  MessageSquare,
  FolderOpen,
  Settings,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import styles from './page.module.css';

// Mock data for dashboard
const stats = [
  { label: 'Employees', value: 3, icon: Users, color: '#6366f1' },
  { label: 'Teams', value: 2, icon: UsersRound, color: '#8b5cf6' },
  { label: 'Active Tasks', value: 5, icon: ListTodo, color: '#22c55e' },
  { label: 'Conversations', value: 8, icon: MessageSquare, color: '#f59e0b' },
];

const recentActivities = [
  { id: 1, text: 'Alice completed task "API Documentation"', time: '2 min ago', type: 'task' },
  { id: 2, text: 'New conversation started in Team Alpha', time: '15 min ago', type: 'chat' },
  { id: 3, text: 'Bob joined Team Backend', time: '1 hour ago', type: 'team' },
  { id: 4, text: 'Reflection generated for Alice', time: '2 hours ago', type: 'memory' },
];

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.closed}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Activity size={24} />
          </div>
          {sidebarOpen && <span className={styles.logoText}>AI-WorkHub</span>}
        </div>

        <nav className={styles.nav}>
          <a href="#" className={`${styles.navItem} ${styles.active}`}>
            <Users size={20} />
            {sidebarOpen && <span>Employees</span>}
          </a>
          <a href="#" className={styles.navItem}>
            <UsersRound size={20} />
            {sidebarOpen && <span>Teams</span>}
          </a>
          <a href="#" className={styles.navItem}>
            <ListTodo size={20} />
            {sidebarOpen && <span>Tasks</span>}
          </a>
          <a href="#" className={styles.navItem}>
            <MessageSquare size={20} />
            {sidebarOpen && <span>Conversations</span>}
          </a>
          <a href="#" className={styles.navItem}>
            <FolderOpen size={20} />
            {sidebarOpen && <span>Work Products</span>}
          </a>
        </nav>

        <div className={styles.navFooter}>
          <a href="#" className={styles.navItem}>
            <Settings size={20} />
            {sidebarOpen && <span>Settings</span>}
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <Badge variant="primary" size="sm">v0.1.0</Badge>
          </div>
          <div className={styles.headerRight}>
            <Button variant="primary" size="sm">
              + New Employee
            </Button>
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
                <Card hover>
                  <CardContent>
                    <div className={styles.statCard}>
                      <div className={styles.statIcon} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                        <stat.icon size={24} />
                      </div>
                      <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stat.value}</span>
                        <span className={styles.statLabel}>{stat.label}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                        <ChevronRight size={16} className={styles.activityArrow} />
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
                    <Button variant="secondary" size="sm" fullWidth>
                      Create Employee
                    </Button>
                    <Button variant="secondary" size="sm" fullWidth>
                      Create Team
                    </Button>
                    <Button variant="secondary" size="sm" fullWidth>
                      Assign Task
                    </Button>
                    <Button variant="secondary" size="sm" fullWidth>
                      Start Conversation
                    </Button>
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
      </main>
    </div>
  );
}
