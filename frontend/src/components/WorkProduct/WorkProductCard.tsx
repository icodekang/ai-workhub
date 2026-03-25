/**
 * WorkProductCard Component
 *
 * Displays a work product file
 */

'use client';

import { motion } from 'framer-motion';
import { FileText, FileCode, Image, File, Download, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import styles from './WorkProductCard.module.css';

interface WorkProductCardProps {
  product: any;
  onView?: (product: any) => void;
  onDownload?: (product: any) => void;
}

const getFileIcon = (mimeType?: string) => {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('javascript') || mimeType.includes('typescript')) return FileCode;
  if (mimeType.includes('text') || mimeType.includes('markdown')) return FileText;
  return File;
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getFileTypeColor = (filename: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return 'info';
    case 'md':
    case 'txt':
      return 'secondary';
    case 'json':
      return 'warning';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return 'success';
    default:
      return 'primary';
  }
};

export function WorkProductCard({ product, onView, onDownload }: WorkProductCardProps) {
  const FileIcon = getFileIcon(product.mimeType);
  const fileTypeColor = getFileTypeColor(product.filename);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card hover className={styles.card}>
        <CardContent>
          <div className={styles.content}>
            <div className={styles.iconWrapper}>
              <FileIcon size={24} />
            </div>

            <div className={styles.info}>
              <h4 className={styles.filename}>{product.filename}</h4>
              <div className={styles.meta}>
                <Badge variant={fileTypeColor} size="sm">
                  {product.filename.split('.').pop()?.toUpperCase() || 'FILE'}
                </Badge>
                <span className={styles.size}>{formatFileSize(product.sizeBytes)}</span>
                <span className={styles.date}>{formatDate(product.createdAt)}</span>
              </div>
              {product.employeeName && (
                <p className={styles.owner}>Created by {product.employeeName}</p>
              )}
            </div>

            <div className={styles.actions}>
              {onView && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Eye size={16} />}
                  onClick={() => onView(product)}
                >
                  View
                </Button>
              )}
              {onDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={() => onDownload(product)}
                >
                  Download
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
