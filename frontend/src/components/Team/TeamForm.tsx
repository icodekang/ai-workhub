/**
 * Team Form Component
 *
 * Form for creating or editing a team
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { useTeamStore } from '@/store/team.store';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/Card';
import styles from './TeamForm.module.css';

interface TeamFormProps {
  team?: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function TeamForm({ team, onClose, onSuccess }: TeamFormProps) {
  const { createTeam, updateTeam, loading } = useTeamStore();
  const isEditing = !!team;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    plan: 'free',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name || '',
        description: team.description || '',
        plan: team.plan || 'free',
      });
    }
  }, [team]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Team name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let result;
    if (isEditing) {
      result = await updateTeam(team.id, formData);
    } else {
      result = await createTeam(formData);
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
            title={isEditing ? 'Edit Team' : 'Create Team'}
            subtitle={isEditing ? `Update ${team.name}` : 'Create a new team to organize your employees'}
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
                  label="Team Name"
                  placeholder="e.g., Backend Team"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  fullWidth
                />

                <div className={styles.field}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Describe the team's purpose and goals..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button variant="ghost" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={loading} icon={<Save size={18} />}>
                {isEditing ? 'Save Changes' : 'Create Team'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
