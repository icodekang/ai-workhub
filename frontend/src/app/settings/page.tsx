/**
 * Settings Page
 *
 * Application settings placeholder
 */

'use client';

import { Settings as SettingsIcon } from 'lucide-react';
import styles from './page.module.css';

export default function SettingsPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.icon}>
            <SettingsIcon size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Settings</h1>
            <p className={styles.subtitle}>Configure your AI-WorkHub workspace</p>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>General</h2>
          <p className={styles.sectionDesc}>Settings page coming soon...</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>API Configuration</h2>
          <p className={styles.sectionDesc}>Configure your LLM API keys and endpoints.</p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Team Settings</h2>
          <p className={styles.sectionDesc}>Manage team defaults and permissions.</p>
        </div>
      </div>
    </div>
  );
}
