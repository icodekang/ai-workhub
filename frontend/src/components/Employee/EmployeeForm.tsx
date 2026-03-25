/**
 * Employee Form Component
 *
 * Form for creating or editing an employee
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useEmployeeStore } from '@/store/employee.store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/Card';
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput } from '@/types/employee';
import styles from './EmployeeForm.module.css';

interface EmployeeFormProps {
  employee?: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

const MODEL_OPTIONS = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'];
const TEMPERATURE_PRESETS = [
  { label: 'Precise (0)', value: 0 },
  { label: 'Balanced (0.5)', value: 0.5 },
  { label: 'Creative (0.8)', value: 0.8 },
  { label: 'Wild (1.0)', value: 1.0 },
];

export function EmployeeForm({ employee, onClose, onSuccess }: EmployeeFormProps) {
  const { createEmployee, updateEmployee, loading } = useEmployeeStore();
  const isEditing = !!employee;

  const [formData, setFormData] = useState<CreateEmployeeInput>({
    name: '',
    role: '',
    identity: '',
    plan: 'free',
    model: 'gpt-4',
    temperature: 0.7,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        role: employee.role,
        identity: employee.identity || '',
        plan: employee.plan,
        model: employee.model,
        temperature: employee.temperature,
      });
    }
  }, [employee]);

  const handleChange = (field: keyof CreateEmployeeInput, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.role.trim()) newErrors.role = 'Role is required';
    if (formData.identity && formData.identity.length > 500) {
      newErrors.identity = 'Identity must be less than 500 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let result;
    if (isEditing && employee) {
      result = await updateEmployee(employee.id, formData as UpdateEmployeeInput);
    } else {
      result = await createEmployee(formData);
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
            title={isEditing ? 'Edit Employee' : 'Create Employee'}
            subtitle={isEditing ? `Update ${employee.name}` : 'Add a new AI employee to your workspace'}
            action={
              <button className={styles.closeButton} onClick={onClose}>
                <X size={20} />
              </button>
            }
          />

          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className={styles.form}>
                <div className={styles.row}>
                  <Input
                    label="Name"
                    placeholder="e.g., Alice"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    error={errors.name}
                    fullWidth
                  />
                  <Input
                    label="Role"
                    placeholder="e.g., Backend Engineer"
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    error={errors.role}
                    fullWidth
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Identity (System Prompt)</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Describe who this AI employee is, their personality, expertise..."
                    value={formData.identity || ''}
                    onChange={(e) => handleChange('identity', e.target.value)}
                    rows={4}
                  />
                  {errors.identity && <span className={styles.error}>{errors.identity}</span>}
                  <span className={styles.hint}>
                    This defines how the AI thinks and behaves. Be specific about their expertise, personality, and goals.
                  </span>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label className={styles.label}>Model</label>
                    <select
                      className={styles.select}
                      value={formData.model}
                      onChange={(e) => handleChange('model', e.target.value)}
                    >
                      {MODEL_OPTIONS.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label}>Temperature</label>
                    <div className={styles.temperaturePresets}>
                      {TEMPERATURE_PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          className={`${styles.presetButton} ${
                            formData.temperature === preset.value ? styles.active : ''
                          }`}
                          onClick={() => handleChange('temperature', preset.value)}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button variant="ghost" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={loading} icon={<Save size={18} />}>
                {isEditing ? 'Save Changes' : 'Create Employee'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
