/**
 * ConversationList Component
 *
 * Displays a list of conversations
 */

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, Users } from 'lucide-react';
import { useConversationStore } from '@/store/conversation.store';
import { useEmployeeStore } from '@/store/employee.store';
import { Card, CardContent } from '@/components/Card';
import { Avatar, AvatarGroup } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import styles from './ConversationList.module.css';

interface ConversationListProps {
  onSelect: (conversation: any) => void;
  onCreate: () => void;
}

export function ConversationList({ onSelect, onCreate }: ConversationListProps) {
  const { conversations, fetchConversations, selectedConversation } = useConversationStore();
  const { employees, fetchEmployees } = useEmployeeStore();

  useEffect(() => {
    fetchConversations();
    fetchEmployees();
  }, [fetchConversations, fetchEmployees]);

  const getParticipantNames = (conv: any) => {
    if (conv.roomType === 'team') {
      return conv.roomId; // Team name would need to be fetched
    }
    return 'Direct Chat';
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles.title}>Conversations</h3>
        <Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={onCreate}>
          New
        </Button>
      </div>

      {/* List */}
      <div className={styles.list}>
        {conversations.length === 0 ? (
          <div className={styles.empty}>
            <MessageSquare size={32} className={styles.emptyIcon} />
            <p>No conversations yet</p>
            <Button variant="secondary" size="sm" onClick={onCreate}>
              Start a chat
            </Button>
          </div>
        ) : (
          conversations.map((conv, index) => (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                hover
                className={`${styles.conversationCard} ${selectedConversation?.id === conv.id ? styles.selected : ''}`}
                onClick={() => onSelect(conv)}
              >
                <CardContent className={styles.cardContent}>
                  <div className={styles.iconWrapper}>
                    {conv.roomType === 'team' ? (
                      <Users size={20} />
                    ) : (
                      <MessageSquare size={20} />
                    )}
                  </div>
                  <div className={styles.info}>
                    <div className={styles.nameRow}>
                      <h4 className={styles.name}>
                        {conv.roomType === 'team' ? `Team: ${conv.roomId}` : 'Direct Message'}
                      </h4>
                      <span className={styles.time}>{formatTime(conv.createdAt)}</span>
                    </div>
                    <p className={styles.preview}>
                      {conv.roomType === 'team' ? `${(conv.participants || []).length} participants` : 'Click to view messages'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
