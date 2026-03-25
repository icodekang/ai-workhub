/**
 * Teams Page
 *
 * Main page for managing teams
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UsersRound, Plus, Search } from 'lucide-react';
import { useTeamStore } from '@/store/team.store';
import { useEmployeeStore } from '@/store/employee.store';
import { TeamCard, TeamForm, AddMemberForm } from '@/components/Team';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import styles from './page.module.css';

export default function TeamsPage() {
  const { teams, fetchTeams, fetchTeam, loading } = useTeamStore();
  const { fetchEmployees } = useEmployeeStore();
  const [search, setSearch] = useState('');
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [addingMemberTo, setAddingMemberTo] = useState<any | null>(null);

  useEffect(() => {
    fetchTeams();
    fetchEmployees();
  }, [fetchTeams, fetchEmployees]);

  const filteredTeams = teams.filter((team) =>
    team.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (team: any) => {
    setEditingTeam(team);
    setShowTeamForm(true);
  };

  const handleAddMember = async (team: any) => {
    // Fetch team with members
    const fullTeam = await fetchTeam(team.id);
    if (fullTeam) {
      setAddingMemberTo(fullTeam);
    }
  };

  const handleCloseForm = () => {
    setShowTeamForm(false);
    setEditingTeam(null);
  };

  const handleFormSuccess = () => {
    setShowTeamForm(false);
    setEditingTeam(null);
    fetchTeams();
  };

  const handleAddMemberSuccess = () => {
    setAddingMemberTo(null);
    fetchTeams();
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.icon}>
            <UsersRound size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Teams</h1>
            <p className={styles.subtitle}>Organize employees into teams</p>
          </div>
        </div>
        <Button variant="primary" icon={<Plus size={18} />} onClick={() => setShowTeamForm(true)}>
          New Team
        </Button>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {/* Search */}
        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <Search size={18} className={styles.searchIcon} />
            <Input
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
            />
          </div>
        </div>

        {/* Teams Grid */}
        {filteredTeams.length > 0 ? (
          <div className={styles.grid}>
            {filteredTeams.map((team, index) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <TeamCard
                  team={team}
                  onEdit={handleEdit}
                  onAddMember={handleAddMember}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <UsersRound size={48} className={styles.emptyIcon} />
            <h3>No teams found</h3>
            <p>Create your first team to start organizing your employees.</p>
            <Button variant="secondary" onClick={() => setShowTeamForm(true)}>
              Create Team
            </Button>
          </div>
        )}
      </div>

      {/* Team Form Modal */}
      <AnimatePresence>
        {showTeamForm && (
          <TeamForm
            team={editingTeam}
            onClose={handleCloseForm}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {addingMemberTo && (
          <AddMemberForm
            team={addingMemberTo}
            onClose={() => setAddingMemberTo(null)}
            onSuccess={handleAddMemberSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
