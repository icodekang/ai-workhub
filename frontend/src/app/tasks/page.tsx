/**
 * Tasks Page
 *
 * Main page for managing tasks
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, Plus, Search, Filter } from 'lucide-react';
import { useTaskStore } from '@/store/task.store';
import { useEmployeeStore } from '@/store/employee.store';
import { useTeamStore } from '@/store/team.store';
import { TaskCard, TaskForm } from '@/components/Task';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import styles from './page.module.css';

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export default function TasksPage() {
  const { tasks, fetchTasks, filters, loading } = useTaskStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const { teams, fetchTeams } = useTeamStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchTeams();
  }, [fetchTasks, fetchEmployees, fetchTeams]);

  // Build task list with assignee names
  const tasksWithAssignees = tasks.map((task) => {
    let assigneeName = 'Unknown';
    if (task.assigneeType === 'employee') {
      const emp = employees.find((e) => e.id === task.assigneeId);
      assigneeName = emp?.name || task.assigneeId;
    } else {
      const team = teams.find((t) => t.id === task.assigneeId);
      assigneeName = team?.name || task.assigneeId;
    }
    return { ...task, assigneeName };
  });

  const filteredTasks = tasksWithAssignees.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group tasks by status for display
  const groupedTasks = {
    pending: filteredTasks.filter((t) => t.status === 'pending'),
    in_progress: filteredTasks.filter((t) => t.status === 'in_progress'),
    completed: filteredTasks.filter((t) => t.status === 'completed'),
    failed: filteredTasks.filter((t) => t.status === 'failed'),
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleFormSuccess = () => {
    setShowTaskForm(false);
    setEditingTask(null);
    fetchTasks();
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.icon}>
            <ListTodo size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Tasks</h1>
            <p className={styles.subtitle}>Manage and track AI agent tasks</p>
          </div>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowTaskForm(true)}>
          New Task
        </Button>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <Input
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </div>
          <div className={styles.statusFilters}>
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                className={`${styles.filterButton} ${statusFilter === filter.value ? styles.active : ''}`}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Task Stats */}
        <div className={styles.stats}>
          <Badge variant="warning" size="sm">{groupedTasks.pending.length} Pending</Badge>
          <Badge variant="info" size="sm">{groupedTasks.in_progress.length} In Progress</Badge>
          <Badge variant="success" size="sm">{groupedTasks.completed.length} Completed</Badge>
          <Badge variant="error" size="sm">{groupedTasks.failed.length} Failed</Badge>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length > 0 ? (
          <div className={styles.grid}>
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={handleEdit} />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <ListTodo size={48} className={styles.emptyIcon} />
            <h3>No tasks found</h3>
            <p>Create a task to assign work to your AI employees.</p>
            <Button variant="secondary" onClick={() => setShowTaskForm(true)}>
              Create Task
            </Button>
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      <AnimatePresence>
        {showTaskForm && (
          <TaskForm
            task={editingTask}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
