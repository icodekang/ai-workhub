/**
 * Employees Page
 *
 * Main page for managing AI employees
 */

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users } from 'lucide-react';
import { EmployeeList, EmployeeForm } from '@/components/Employee';
import type { Employee } from '@/types/employee';
import styles from './page.module.css';

export default function EmployeesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const handleSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.icon}>
            <Users size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Employees</h1>
            <p className={styles.subtitle}>Manage your AI workforce</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className={styles.content}>
        <EmployeeList
          onSelect={handleSelect}
          onCreate={handleCreate}
          onEdit={handleEdit}
        />
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <EmployeeForm
            employee={editingEmployee}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
