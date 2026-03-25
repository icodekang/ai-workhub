/**
 * Conversations Page
 *
 * Main page for viewing conversations
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, X } from 'lucide-react';
import { useConversationStore } from '@/store/conversation.store';
import { useEmployeeStore } from '@/store/employee.store';
import { ConversationList, ChatWindow } from '@/components/Conversation';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import styles from './page.module.css';

export default function ConversationsPage() {
  const { selectedConversation, selectConversation, createConversation } = useConversationStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const [showNewChat, setShowNewChat] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [chatType, setChatType] = useState<'direct' | 'team'>('direct');

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleSelectConversation = (conversation: any) => {
    selectConversation(conversation);
  };

  const handleBack = () => {
    selectConversation(null);
  };

  const handleCreateChat = async () => {
    if (chatType === 'direct' && selectedEmployee) {
      // Create direct conversation
      const result = await createConversation({
        type: 'direct',
        initiatorId: employees[0]?.id || 'agent-1',
        recipientId: selectedEmployee,
      });
      if (result) {
        selectConversation(result);
      }
      setShowNewChat(false);
    } else if (chatType === 'team' && selectedTeam) {
      // Create team conversation
      const result = await createConversation({
        type: 'team',
        teamId: selectedTeam,
      });
      if (result) {
        selectConversation(result);
      }
      setShowNewChat(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Sidebar - Conversation List */}
      <div className={`${styles.sidebar} ${selectedConversation ? styles.hiddenMobile : ''}`}>
        <ConversationList
          onSelect={handleSelectConversation}
          onCreate={() => setShowNewChat(true)}
        />
      </div>

      {/* Main - Chat Window */}
      <div className={`${styles.main} ${selectedConversation ? styles.visibleMobile : ''}`}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onBack={handleBack}
          />
        ) : (
          <div className={styles.placeholder}>
            <MessageSquare size={64} className={styles.placeholderIcon} />
            <h2>Select a conversation</h2>
            <p>Choose a conversation from the sidebar or start a new one.</p>
            <Button variant="primary" onClick={() => setShowNewChat(true)}>
              Start New Chat
            </Button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={showNewChat}
        onClose={() => setShowNewChat(false)}
        title="Start New Chat"
        description="Select who you want to chat with"
        size="sm"
      >
        <div className={styles.newChatForm}>
          {/* Chat Type Toggle */}
          <div className={styles.typeToggle}>
            <button
              className={`${styles.toggleOption} ${chatType === 'direct' ? styles.active : ''}`}
              onClick={() => setChatType('direct')}
            >
              <MessageSquare size={18} />
              Direct
            </button>
            <button
              className={`${styles.toggleOption} ${chatType === 'team' ? styles.active : ''}`}
              onClick={() => setChatType('team')}
            >
              <Users size={18} />
              Team
            </button>
          </div>

          {/* Selection */}
          {chatType === 'direct' ? (
            <div className={styles.selection}>
              <label className={styles.label}>Select Employee</label>
              <select
                className={styles.select}
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">Choose an employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.selection}>
              <label className={styles.label}>Select Team</label>
              <select
                className={styles.select}
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">Choose a team...</option>
                <option value="team-1">Backend Team</option>
                <option value="team-2">Frontend Team</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setShowNewChat(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateChat}
              disabled={chatType === 'direct' ? !selectedEmployee : !selectedTeam}
            >
              Start Chat
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
