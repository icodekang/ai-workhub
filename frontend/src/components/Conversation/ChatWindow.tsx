/**
 * ChatWindow Component
 *
 * Displays messages in a conversation
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, ArrowLeft } from 'lucide-react';
import { useConversationStore } from '@/store/conversation.store';
import { useEmployeeStore } from '@/store/employee.store';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import styles from './ChatWindow.module.css';

interface ChatWindowProps {
  conversation: any;
  onBack?: () => void;
}

export function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const { messages, fetchMessages, sendMessage, loading } = useConversationStore();
  const { employees, fetchEmployees } = useEmployeeStore();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEmployees();
    if (conversation) {
      fetchMessages(conversation.id);
    }
  }, [conversation, fetchMessages, fetchEmployees]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation) return;

    // For demo, use first employee as sender
    const senderId = employees[0]?.id || 'agent-1';
    
    await sendMessage(conversation.id, {
      senderId,
      senderType: 'agent',
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSenderName = (msg: any) => {
    if (msg.senderName) return msg.senderName;
    const emp = employees.find((e) => e.id === msg.senderId);
    return emp?.name || msg.senderId;
  };

  const groupMessagesByDate = (msgs: any[]) => {
    const groups: { [key: string]: any[] } = {};
    msgs.forEach((msg) => {
      const date = formatDate(msg.createdAt);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        {onBack && (
          <button className={styles.backButton} onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className={styles.headerInfo}>
          <h3 className={styles.headerTitle}>
            {conversation.roomType === 'team' ? `Team Chat` : 'Direct Message'}
          </h3>
          <p className={styles.headerSubtitle}>
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.length === 0 ? (
          <div className={styles.empty}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, msgs]) => (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateDivider}>
                <span>{date}</span>
              </div>
              {msgs.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`${styles.message} ${msg.senderType === 'agent' ? styles.agent : styles.user}`}
                >
                  <Avatar name={getSenderName(msg)} size="sm" />
                  <div className={styles.messageContent}>
                    <div className={styles.messageHeader}>
                      <span className={styles.senderName}>{getSenderName(msg)}</span>
                      <span className={styles.time}>{formatTime(msg.createdAt)}</span>
                    </div>
                    <p className={styles.messageText}>{msg.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          fullWidth
        />
        <Button
          variant="primary"
          icon={<Send size={18} />}
          onClick={handleSend}
          disabled={!newMessage.trim()}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
