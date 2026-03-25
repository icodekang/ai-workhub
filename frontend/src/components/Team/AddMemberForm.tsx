/**
 * Add Member Form Component
 *
 * Form for adding a member to a team
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
import { useTeamStore } from '@/store/team.store';
import { useEmployeeStore } from '@/store/employee.store';
import { Button } from '@/components/Button';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import styles from './AddMemberForm.module.css';

interface AddMemberFormProps {
  team: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMemberForm({ team, onClose, onSuccess }: AddMemberFormProps) {
  const { addMember, loading } = useTeamStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [role, setRole] = useState<'member' | 'leader'>('member');

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter out employees already in the team
  const existingMemberIds = new Set((team.members || []).map((m: any) => m.employeeId));
  const availableEmployees = employees.filter((e) => !existingMemberIds.has(e.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    const success = await addMember(team.id, selectedEmployeeId, role);
    if (success) {
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
            title="Add Member"
            subtitle={`Add an employee to ${team.name}`}
            action={
              <button className={styles.closeButton} onClick={onClose}>
                <X size={20} />
              </button>
            }
          />

          <form onSubmit={handleSubmit}>
            <CardContent>
              {availableEmployees.length === 0 ? (
                <div className={styles.empty}>
                  <p>All employees are already members of this team.</p>
                </div>
              ) : (
                <div className={styles.form}>
                  <div className={styles.field}>
                    <label className={styles.label}>Select Employee</label>
                    <div className={styles.employeeList}>
                      {availableEmployees.map((employee) => (
                        <button
                          key={employee.id}
                          type="button"
                          className={`${styles.employeeOption} ${
                            selectedEmployeeId === employee.id ? styles.selected : ''
                          }`}
                          onClick={() => setSelectedEmployeeId(employee.id)}
                        >
                          <Avatar name={employee.name} size="sm" />
                          <div className={styles.employeeInfo}>
                            <span className={styles.employeeName}>{employee.name}</span>
                            <span className={styles.employeeRole}>{employee.role}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Role</label>
                    <div className={styles.roleOptions}>
                      <button
                        type="button"
                        className={`${styles.roleOption} ${role === 'member' ? styles.selected : ''}`}
                        onClick={() => setRole('member')}
                      >
                        Member
                      </button>
                      <button
                        type="button"
                        className={`${styles.roleOption} ${role === 'leader' ? styles.selected : ''}`}
                        onClick={() => setRole('leader')}
                      >
                        Leader 👑
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter>
              <Button variant="ghost" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                loading={loading}
                disabled={!selectedEmployeeId}
                icon={<UserPlus size={18} />}
              >
                Add to Team
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
