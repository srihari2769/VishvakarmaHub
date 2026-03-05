'use client';

import { useState, useRef, useCallback } from 'react';
import clsx from 'clsx';
import {
  PhotoIcon,
  DocumentIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

interface FileUploadProps {
  label?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  error?: string;
  hint?: string;
  className?: string;
}

export default function FileUpload({
  label,
  accept = 'image/*,.pdf',
  multiple = false,
  maxFiles = 5,
  maxSizeMB = 10,
  files,
  onChange,
  error,
  hint,
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadToServer = async (file: File): Promise<UploadedFile | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        return {
          url: data.data.url,
          name: file.name,
          size: file.size,
          type: file.type,
        };
      } else {
        setUploadError(data.error || data.message || 'Upload failed');
        return null;
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Upload failed. Please check your connection and try again.');
      return null;
    }
  };

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      setUploadError('');
      const selectedFiles = Array.from(fileList);

      // Validate count
      if (files.length + selectedFiles.length > maxFiles) {
        setUploadError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate size
      for (const file of selectedFiles) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          setUploadError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
          return;
        }
      }

      setUploading(true);

      const uploadedFiles: UploadedFile[] = [];
      for (const file of selectedFiles) {
        const result = await uploadToServer(file);
        if (result) uploadedFiles.push(result);
      }

      if (uploadedFiles.length > 0) {
        onChange(multiple ? [...files, ...uploadedFiles] : uploadedFiles);
      }

      setUploading(false);
    },
    [files, maxFiles, maxSizeMB, multiple, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const isImage = (type: string) => type.startsWith('image/');

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
          isDragOver
            ? 'border-blue bg-blue/5'
            : error
            ? 'border-danger/50 hover:border-danger'
            : 'border-border hover:border-blue/50 hover:bg-blue/5',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin w-8 h-8 border-2 border-blue border-t-transparent rounded-full" />
            <p className="text-sm text-muted">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ArrowUpTrayIcon className="w-10 h-10 text-muted" />
            <div>
              <p className="text-sm text-foreground font-medium">
                Drag & drop or <span className="text-blue">browse files</span>
              </p>
              {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
              <p className="text-xs text-muted mt-0.5">
                Max {maxSizeMB}MB per file{multiple ? ` · Up to ${maxFiles} files` : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Error */}
      {(uploadError || error) && (
        <p className="mt-1 text-xs text-danger">{uploadError || error}</p>
      )}

      {/* File Preview List */}
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2.5 bg-card border border-border rounded-xl"
            >
              {/* Thumbnail */}
              {isImage(file.type) ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-card-hover shrink-0">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-orange/10 flex items-center justify-center shrink-0">
                  <DocumentIcon className="w-5 h-5 text-orange" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted">{formatSize(file.size)}</p>
              </div>

              {/* Status & Remove */}
              <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="p-1 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
              >
                <XMarkIcon className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
