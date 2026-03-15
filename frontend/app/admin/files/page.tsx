'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, FileText, ImageIcon, RefreshCw, Trash2, Download, Search, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import PageHeader from '@/app/admin/components/PageHeader';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
const PUBLIC_MEDIA_BASE = `${API_BASE}/media`;
const ADMIN_MEDIA_BASE = `${API_BASE}/admin/media`;

interface MediaFile {
  id: string;
  file_name: string;
  content_type: string;
  size: number;
  created_at: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ contentType }: { contentType: string }) {
  if (contentType.startsWith('image/')) {
    return <ImageIcon className="w-4 h-4 text-brand-500" />;
  }
  return <FileText className="w-4 h-4 text-text-tertiary" />;
}

export default function FilesPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ADMIN_MEDIA_BASE, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setFiles(Array.isArray(data) ? data : data.items ?? data.files ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFiles();
  }, [fetchFiles]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(PUBLIC_MEDIA_BASE, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      await fetchFiles();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [fetchFiles]);

  const filtered = files.filter((f) =>
    f.file_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = useCallback(async (file: MediaFile) => {
    if (!confirm(`ลบไฟล์ "${file.file_name}"?`)) return;

    try {
      const res = await fetch(`${ADMIN_MEDIA_BASE}/${file.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      await fetchFiles();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  }, [fetchFiles]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader title="ไฟล์มีเดีย" subtitle="จัดการไฟล์ที่อัปโหลดเข้าระบบ">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFiles}
            disabled={loading}
          >
            <RefreshCw className={cn('w-4 h-4 mr-1.5', loading && 'animate-spin')} />
            รีเฟรช
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-1.5" />
            {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลด'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,.doc,.docx"
            className="hidden"
            onChange={handleUpload}
          />
        </div>
      </PageHeader>

      {/* Search */}
      <Input
        variant="outline"
        leftIcon={<Search className="w-4 h-4" />}
        placeholder="ค้นหาไฟล์..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {/* File Table */}
      <Card variant="default" padding="none">
        <CardHeader divider className="px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle>รายการไฟล์</CardTitle>
            <span className="text-sm text-text-tertiary">{filtered.length} ไฟล์</span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
              <FolderOpen className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">{error}</p>
              <Button variant="ghost" size="sm" className="mt-3" onClick={fetchFiles}>
                ลองอีกครั้ง
              </Button>
            </div>
          ) : loading ? (
            <div className="divide-y divide-border-subtle">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-bg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-border-default rounded w-48" />
                    <div className="h-3 bg-border-subtle rounded w-32" />
                  </div>
                  <div className="h-3 bg-border-subtle rounded w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
              <FolderOpen className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm">
                {search ? 'ไม่พบไฟล์ที่ค้นหา' : 'ยังไม่มีไฟล์ที่อัปโหลด'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default bg-bg">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">ไฟล์</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">ประเภท</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">ขนาด</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider">วันที่อัปโหลด</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filtered.map((file) => (
                    <tr key={file.id} className="hover:bg-bg/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                            <FileTypeIcon contentType={file.content_type} />
                          </div>
                          <span className="font-medium text-text-primary truncate max-w-[240px]">
                            {file.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {file.content_type}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {new Date(file.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`${PUBLIC_MEDIA_BASE}/${file.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="ดาวน์โหลด"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            className="p-1.5 rounded-lg text-text-tertiary hover:text-danger hover:bg-danger/5 transition-colors"
                            title="ลบ"
                            onClick={() => void handleDelete(file)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
