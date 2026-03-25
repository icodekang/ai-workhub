/**
 * TeamCard Component
 *
 * Displays a team with its members
 */

'use client';

import { motion } from 'framer-motion';
import { Users, MoreVertical, Trash2, Edit2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTeamStore } from '@/store/team.store';
import { useEmployeeStore } from '@/store/employee.store';
import { Card, CardHeader, CardContent } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Avatar, AvatarGroup } from '@/components/Avatar';
import { Button } from '@/components/Button';
import styles from './TeamCard.module.css';

interface TeamCardProps {
  team: any;
  onEdit: (team: any) => void;
  onAddMember: (team: any) => void;
}

export function TeamCard({ team, onEdit, onAddMember }: TeamCardProps) {
  const { deleteTeam } = useTeamStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete team "${team.name}"?`)) {
      await deleteTeam(team.id);
    }
    setMenuOpen(false);
  };

  const memberAvatars = (team.members || []).map((m: any) => ({
    name: m.name,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card hover className={styles.card}>
        <CardContent>
          <div className={styles.header}>
            <div className={styles.iconWrapper}>
              <Users size={20} />
            </div>
            <div className={styles.info}>
              <h3 className={styles.name}>{team.name}</h3>
              {team.description && (
                <p className={styles.description}>{team.description}</p>
              )}
            </div>
            <div className={styles.actions}>
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
                      onEdit(team);
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

          <div className={styles.members}>
            <div className={styles.membersHeader}>
              <span className={styles.membersLabel}>Members</span>
              <Badge variant="default" size="sm">
                {(team.members || []).length} member{(team.members || []).length !== 1 ? 's' : ''}
              </Badge>
            </div>
            {memberAvatars.length > 0 ? (
              <div className={styles.membersContent}>
                <AvatarGroup avatars={memberAvatars} max={5} size="sm" />
                <div className={styles.memberNames}>
                  {(team.members || []).map((m: any, i: number) => (
                    <span key={i} className={styles.memberName}>
                      {m.name}
                      {m.role === 'leader' && ' 👑'}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className={styles.noMembers}>No members yet</p>
            )}
          </div>

          <div className={styles.footer}>
            <Button
              variant="ghost"
              size="sm"
              icon={<UserPlus size={16} />}
              onClick={() => onAddMember(team)}
            >
              Add Member
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
