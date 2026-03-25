/**
 * TaskCard Component
 *
 * Displays a task with status and actions
 */

'use client';

import { motion } from 'framer-motion';
import { MoreVertical, Trash2, Edit2, Play, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';
import { useTaskStore } from '@/store/task.store';
import { Card, CardContent } from '@/components/Card';
import { Badge, StatusBadge } from '@/components/Badge';
import styles from './TaskCard.module.css';

interface TaskCardProps {
  task: any;
  onEdit: (task: any) => void;
}

const statusConfig = {
  pending: { label: 'Pending', variant: 'warning' as const },
  in_progress: { label: 'In Progress', variant: 'info' as const },
  completed: { label: 'Completed', variant: 'success' as const },
  failed: { label: 'Failed', variant: 'error' as const },
};

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const { deleteTask, executeTask } = useTaskStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [executing, setExecuting] = useState(false);

  const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.pending;
  const canExecute = task.status === 'pending';

  const handleExecute = async () => {
    setExecuting(true);
    await executeTask(task.id);
    setExecuting(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      await deleteTask(task.id);
    }
    setMenuOpen(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={styles.card}>
        <CardContent>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <h3 className={styles.title}>{task.title}</h3>
              <Badge variant={status.variant} size="sm">
                {status.label}
              </Badge>
            </div>

            <div className={styles.actions}>
              {canExecute && (
                <button
                  className={styles.actionButton}
                  onClick={handleExecute}
                  disabled={executing}
                  title="Execute Task"
                >
                  <Play size={16} />
                </button>
              )}
              <button
                className={styles.menuButton}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <MoreVertical size={18} />
              </button>
              {menuOpen && (
                <div className={styles.menu}>
                  <button
                    className={styles.menuItem}
                    onClick={() => {
                      onEdit(task);
                      setMenuOpen(false);
                    }}
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    className={`${styles.menuItem} ${styles.danger}`}
                    onClick={handleDelete}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {task.description && (
            <p className={styles.description}>{task.description}</p>
          )}

          <div className={styles.meta}>
            <div className={styles.metaItem}>
              <Clock size={14} />
              <span>{formatDate(task.createdAt)}</span>
            </div>
            {task.assigneeName && (
              <div className={styles.assignee}>
                Assigned to: <span>{task.assigneeName}</span>
              </div>
            )}
          </div>

          {task.result && (
            <div className={styles.result}>
              <span className={styles.resultLabel}>Result:</span>
              <p className={styles.resultText}>{task.result}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
