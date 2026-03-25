/**
 * Employee List Component
 *
 * Displays a list of employees with search and filtering
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useEmployeeStore } from '@/store/employee.store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardContent } from '@/components/Card';
import { Badge, StatusBadge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import styles from './EmployeeList.module.css';

interface EmployeeListProps {
  onSelect: (employee: any) => void;
  onCreate: () => void;
  onEdit: (employee: any) => void;
}

export function EmployeeList({ onSelect, onCreate, onEdit }: EmployeeListProps) {
  const { employees, fetchEmployees, deleteEmployee, loading } = useEmployeeStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      await deleteEmployee(id);
    }
    setMenuOpen(null);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </div>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="busy">Busy</option>
          </select>
          <Button variant="primary" icon={<Plus size={18} />} onClick={onCreate}>
            New Employee
          </Button>
        </div>
      </div>

      {/* Employee Grid */}
      <div className={styles.grid}>
        {filteredEmployees.map((employee, index) => (
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover onClick={() => onSelect(employee)} className={styles.employeeCard}>
              <CardContent>
                <div className={styles.employeeRow}>
                  <Avatar name={employee.name} size="lg" status={employee.status as any} />
                  <div className={styles.employeeInfo}>
                    <h3 className={styles.employeeName}>{employee.name}</h3>
                    <p className={styles.employeeRole}>{employee.role}</p>
                    <div className={styles.employeeMeta}>
                      <Badge variant="default" size="sm">{employee.model}</Badge>
                      <StatusBadge status={employee.status as any} size="sm" />
                    </div>
                  </div>
                  <div className={styles.actions}>
                    <button
                      className={styles.menuButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(menuOpen === employee.id ? null : employee.id);
                      }}
                    >
                      <MoreVertical size={18} />
                    </button>
                    {menuOpen === employee.id && (
                      <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
                        <button
                          className={styles.menuItem}
                          onClick={() => {
                            onEdit(employee);
                            setMenuOpen(null);
                          }}
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        <button
                          className={`${styles.menuItem} ${styles.danger}`}
                          onClick={() => handleDelete(employee.id)}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredEmployees.length === 0 && !loading && (
        <div className={styles.empty}>
          <p>No employees found</p>
          <Button variant="secondary" onClick={onCreate}>
            Create your first employee
          </Button>
        </div>
      )}
    </div>
  );
}
