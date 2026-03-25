/**
 * File Storage Service
 *
 * Part of TASK-5.1 - File Storage System
 *
 * Provides file upload, storage, and retrieval capabilities.
 * Uses local filesystem for storage (can be extended to S3/GCS/etc.)
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'storage', 'uploads');
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || String(10 * 1024 * 1024), 10); // 10MB default
const ALLOWED_MIME_TYPES = [
  'text/plain',
  'text/markdown',
  'text/html',
  'text/css',
  'text/javascript',
  'application/json',
  'application/javascript',
  'application/typescript',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
];

export interface StoredFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  createdAt: number;
}

export interface UploadOptions {
  folder?: string;
  maxSize?: number;
  allowedTypes?: string[];
}

export interface UploadResult {
  success: boolean;
  file?: StoredFile;
  error?: string;
}

/**
 * Ensure upload directory exists
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Get the full upload path
 */
function getUploadPath(folder?: string): string {
  const baseDir = UPLOAD_DIR;
  if (folder) {
    return path.join(baseDir, folder);
  }
  return baseDir;
}

/**
 * Generate a unique filename
 */
function generateFilename(originalName: string): string {
  const ext = path.extname(originalName);
  const basename = path.basename(originalName, ext);
  const uniqueId = uuidv4().slice(0, 8);
  return `${basename}-${uniqueId}${ext}`;
}

/**
 * Upload a file buffer
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // Validate mime type
    const allowedTypes = options.allowedTypes || ALLOWED_MIME_TYPES;
    if (!allowedTypes.includes(mimeType)) {
      return {
        success: false,
        error: `File type not allowed: ${mimeType}`,
      };
    }

    // Validate size
    const maxSize = options.maxSize || MAX_FILE_SIZE;
    if (buffer.length > maxSize) {
      return {
        success: false,
        error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
      };
    }

    // Generate unique filename and path
    const uploadDir = getUploadPath(options.folder);
    ensureDir(uploadDir);

    const filename = generateFilename(originalName);
    const filePath = path.join(uploadDir, filename);

    // Write file
    await fs.promises.writeFile(filePath, buffer);

    // Create stored file record
    const storedFile: StoredFile = {
      id: uuidv4(),
      filename,
      originalName,
      mimeType,
      size: buffer.length,
      path: filePath,
      url: `/api/files/${filename}`,
      createdAt: Date.now(),
    };

    console.log(`[FileStorage] Uploaded file: ${filename} (${buffer.length} bytes)`);

    return {
      success: true,
      file: storedFile,
    };
  } catch (error: any) {
    console.error('[FileStorage] Upload failed:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

/**
 * Upload a file from a temporary path
 */
export async function uploadFromPath(
  sourcePath: string,
  originalName: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    const buffer = await fs.promises.readFile(sourcePath);
    const stats = await fs.promises.stat(sourcePath);
    const mimeType = getMimeType(originalName);

    return uploadFile(buffer, originalName, mimeType, options);
  } catch (error: any) {
    console.error('[FileStorage] Upload from path failed:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
}

/**
 * Get file info by filename
 */
export async function getFileInfo(filename: string): Promise<StoredFile | null> {
  try {
    const uploadDir = getUploadPath();
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = await fs.promises.stat(filePath);
    const ext = path.extname(filename).toLowerCase();

    const storedFile: StoredFile = {
      id: uuidv4(),
      filename,
      originalName: filename,
      mimeType: getMimeTypeFromExt(ext),
      size: stats.size,
      path: filePath,
      url: `/api/files/${filename}`,
      createdAt: stats.birthtimeMs,
    };

    return storedFile;
  } catch (error) {
    console.error('[FileStorage] Get file info failed:', error);
    return null;
  }
}

/**
 * Read file contents
 */
export async function readFile(filename: string): Promise<Buffer | null> {
  try {
    const uploadDir = getUploadPath();
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    return await fs.promises.readFile(filePath);
  } catch (error) {
    console.error('[FileStorage] Read file failed:', error);
    return null;
  }
}

/**
 * Delete a file
 */
export async function deleteFile(filename: string): Promise<boolean> {
  try {
    const uploadDir = getUploadPath();
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`[FileStorage] Deleted file: ${filename}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[FileStorage] Delete file failed:', error);
    return false;
  }
}

/**
 * List all files in storage
 */
export async function listFiles(folder?: string): Promise<StoredFile[]> {
  try {
    const uploadDir = getUploadPath(folder);
    ensureDir(uploadDir);

    const files = await fs.promises.readdir(uploadDir);
    const storedFiles: StoredFile[] = [];

    for (const filename of files) {
      const filePath = path.join(uploadDir, filename);
      const stats = await fs.promises.stat(filePath);

      if (stats.isFile()) {
        const ext = path.extname(filename).toLowerCase();
        storedFiles.push({
          id: uuidv4(),
          filename,
          originalName: filename,
          mimeType: getMimeTypeFromExt(ext),
          size: stats.size,
          path: filePath,
          url: `/api/files/${filename}`,
          createdAt: stats.birthtimeMs,
        });
      }
    }

    return storedFiles.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('[FileStorage] List files failed:', error);
    return [];
  }
}

/**
 * Get MIME type from filename
 */
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return getMimeTypeFromExt(ext);
}

/**
 * Get MIME type from extension
 */
function getMimeTypeFromExt(ext: string): string {
  const mimeTypes: Record<string, string> = {
    '.txt': 'text/plain',
    '.md': 'text/markdown',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.json': 'application/json',
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Create a storage subdirectory
 */
export async function createFolder(folder: string): Promise<boolean> {
  try {
    const folderPath = getUploadPath(folder);
    ensureDir(folderPath);
    console.log(`[FileStorage] Created folder: ${folder}`);
    return true;
  } catch (error) {
    console.error('[FileStorage] Create folder failed:', error);
    return false;
  }
}

/**
 * Delete a storage folder
 */
export async function deleteFolder(folder: string): Promise<boolean> {
  try {
    const folderPath = getUploadPath(folder);
    
    if (fs.existsSync(folderPath)) {
      await fs.promises.rm(folderPath, { recursive: true });
      console.log(`[FileStorage] Deleted folder: ${folder}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('[FileStorage] Delete folder failed:', error);
    return false;
  }
}
