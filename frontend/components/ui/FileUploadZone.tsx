'use client';

import React, { useCallback } from 'react';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { Upload, FileText, Image as ImageIcon, Film, Music, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-info" />;
  if (type.startsWith('video/')) return <Film className="w-5 h-5 text-brand-500" />;
  if (type.startsWith('audio/')) return <Music className="w-5 h-5 text-success" />;
  if (type.includes('pdf') || type.includes('document')) return <FileText className="w-5 h-5 text-danger" />;
  return <File className="w-5 h-5 text-text-tertiary" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function FileUploadZone({
  onFilesSelected,
  onFilesRejected,
  accept,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
  className,
  children,
}: FileUploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], rejections: FileRejection[]) => {
      if (acceptedFiles.length > 0) onFilesSelected(acceptedFiles);
      if (rejections.length > 0) onFilesRejected?.(rejections);
    },
    [onFilesSelected, onFilesRejected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 cursor-pointer',
        'hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/20',
        isDragActive && !isDragReject && 'border-brand-500 bg-brand-50 dark:bg-brand-950/30',
        isDragReject && 'border-danger bg-danger-light/20',
        disabled && 'opacity-50 cursor-not-allowed',
        !isDragActive && !isDragReject && 'border-border-default',
        className
      )}
    >
      <input {...getInputProps()} />
      {children ?? (
        <div className="flex flex-col items-center gap-2">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-colors',
            isDragActive ? 'bg-brand-100 dark:bg-brand-900' : 'bg-gray-100 dark:bg-gray-800'
          )}>
            <Upload className={cn(
              'w-6 h-6 transition-colors',
              isDragActive ? 'text-brand-600' : 'text-text-tertiary'
            )} />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">
              {isDragActive ? 'วางไฟล์ที่นี่' : 'ลากไฟล์มาวาง หรือคลิกเพื่อเลือก'}
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              สูงสุด {maxFiles} ไฟล์ (ไม่เกิน {formatFileSize(maxSize)} ต่อไฟล์)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export { getFileIcon, formatFileSize };
export default FileUploadZone;
