/**
 * Task Form Component
 *
 * Form for creating or editing a task
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useTaskStore } from '@/store/task.store';
import { useEmployeeStore } from '@/store/employee.store';
import { useTeamStore } from '@/store/team.store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/Card';
import styles from './TaskForm.module.css';

interface TaskFormProps {
  task?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TaskForm({ task, onClose, onSuccess }: TaskFormProps) {
  const { createTask, updateTask, loading } = useTaskStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const { teams, fetchTeams } = useTeamStore();
  const isEditing = !!task;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeType: 'employee' as 'employee' | 'team',
    assigneeId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchEmployees();
    fetchTeams();
  }, [fetchEmployees, fetchTeams]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assigneeType: task.assigneeType || 'employee',
        assigneeId: task.assigneeId || '',
      });
    }
  }, [task]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Task title is required';
    if (!formData.assigneeId) newErrors.assigneeId = 'Please select an assignee';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let result;
    if (isEditing) {
      result = await updateTask(task.id, formData);
    } else {
      result = await createTask(formData);
    }

    if (result) {
      onSuccess();
    }
  };

  return (
    <div className={styles.overlay}>
      <motion.div
        className={styles.modal}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
      >
        <Card>
          <CardHeader
            title={isEditing ? 'Edit Task' : 'Create Task'}
            subtitle={isEditing ? `Update "${task.title}"` : 'Assign a new task to an employee or team'}
            action={
              <button className={styles.closeButton} onClick={onClose}>
                <X size={20} />
              </button>
            }
          />

          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className={styles.form}>
                <Input
                  label="Task Title"
                  placeholder="e.g., Complete API documentation"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  error={errors.title}
                  fullWidth
                />

                <div className={styles.field}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Describe the task in detail..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Assign To</label>
                  <div className={styles.assigneeTypeToggle}>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${formData.assigneeType === 'employee' ? styles.active : ''}`}
                      onClick={() => handleChange('assigneeType', 'employee')}
                    >
                      Employee
                    </button>
                    <button
                      type="button"
                      className={`${styles.toggleButton} ${formData.assigneeType === 'team' ? styles.active : ''}`}
                      onClick={() => handleChange('assigneeType', 'team')}
                    >
                      Team
                    </button>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>
                    Select {formData.assigneeType === 'employee' ? 'Employee' : 'Team'}
                  </label>
                  {formData.assigneeType === 'employee' ? (
                    <select
                      className={styles.select}
                      value={formData.assigneeId}
                      onChange={(e) => handleChange('assigneeId', e.target.value)}
                    >
                      <option value="">Select an employee...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.role})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      className={styles.select}
                      value={formData.assigneeId}
                      onChange={(e) => handleChange('assigneeId', e.target.value)}
                    >
                      <option value="">Select a team...</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.assigneeId && <span className={styles.error}>{errors.assigneeId}</span>}
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button variant="ghost" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={loading} icon={<Save size={18} />}>
                {isEditing ? 'Save Changes' : 'Create Task'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
