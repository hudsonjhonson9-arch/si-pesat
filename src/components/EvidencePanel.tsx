/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Eye, Download, ExternalLink, FileText, FileSpreadsheet, File, Image, Link2, Copy, CheckCircle2, Loader2, AlertTriangle, History, Pencil, Check } from 'lucide-react';

interface EvidenceHistoryEntry {
  name: string;
  link: string;
  uploadedAt: string;
  uploadedBy: string;
  action?: 'diunggah' | 'ditautkan' | 'dihapus' | 'diubah';
}

interface EvidencePanelProps {
  evidenceLink?: string;
  evidenceName?: string;
  evidenceHistory?: EvidenceHistoryEntry[];
  isReadOnly?: boolean;
  isAuditor?: boolean;
  onUploadFile: (file: File, newName?: string) => Promise<void>;
  onCopyFromUrl: (url: string, name: string) => Promise<void>;
  onChangeLink: (link: string) => void;
  onChangeName: (name: string) => void;
  onClear: () => void;
  onAddHistory?: (action: 'diunggah' | 'ditautkan' | 'dihapus' | 'diubah', name: string, link: string) => void;
  isUploading?: boolean;
  isCopying?: boolean;
}

// Extract Google Drive File ID from any GDrive URL format
function extractDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Convert a GDrive / Docs URL to an embeddable/preview URL (supports PDF, Excel, DOCX, Sheets, Docs, Slides)
function toEmbedUrl(url: string): string | null {
  // Google Sheets (docs.google.com/spreadsheets)
  if (url.includes('docs.google.com/spreadsheets')) {
    const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/spreadsheets/d/${m[1]}/htmlview?embedded=true`;
  }
  // Google Docs (docs.google.com/document)
  if (url.includes('docs.google.com/document')) {
    const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/document/d/${m[1]}/preview`;
  }
  // Google Slides (docs.google.com/presentation)
  if (url.includes('docs.google.com/presentation')) {
    const m = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/presentation/d/${m[1]}/preview`;
  }
  // Drive-uploaded file (PDF, Excel, DOCX, images, etc.) — Google renders Office files natively
  const id = extractDriveFileId(url);
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  // External Office files (xlsx, docx, pptx) — fallback to Microsoft Office Online Viewer
  const ext = url.split('.').pop()?.toLowerCase();
  if (ext && ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return null;
}

// Get file type icon & color based on name/url
function getFileIcon(name?: string, url?: string) {
  const src = name || url || '';
  const ext = src.split('.').pop()?.toLowerCase() || '';
  // Detect Google Docs types from URL
  if (url?.includes('docs.google.com/spreadsheets')) return { icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Google Sheets' };
  if (url?.includes('docs.google.com/document')) return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Google Docs' };
  if (url?.includes('docs.google.com/presentation')) return { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Google Slides' };
  if (['pdf'].includes(ext)) return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50', label: 'PDF' };
  if (['xlsx', 'xls', 'csv'].includes(ext)) return { icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excel' };
  if (['docx', 'doc'].includes(ext)) return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Word' };
  if (['pptx', 'ppt'].includes(ext)) return { icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', label: 'PowerPoint' };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { icon: Image, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Gambar' };
  return { icon: File, color: 'text-dark-gray/60', bg: 'bg-dark-gray/5', label: 'Berkas' };
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

export default function EvidencePanel({
  evidenceLink,
  evidenceName,
  evidenceHistory = [],
  isReadOnly = false,
  isAuditor = true,
  onUploadFile,
  onCopyFromUrl,
  onChangeLink,
  onChangeName,
  onClear,
  onAddHistory,
  isUploading = false,
  isCopying = false,
}: EvidencePanelProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [tab, setTab] = useState<'upload' | 'link'>('upload');
  const [isRenamingDoc, setIsRenamingDoc] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [pendingUploadName, setPendingUploadName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasEvidence = !!(evidenceLink);
  const embedUrl = evidenceLink ? toEmbedUrl(evidenceLink) : null;
  const isDriveLink = evidenceLink?.includes('drive.google.com');
  const fileInfo = getFileIcon(evidenceName, evidenceLink);
  const FileIcon = fileInfo.icon;

  const initiateUpload = (file: File) => {
    setPendingUploadFile(file);
    const dotIndex = file.name.lastIndexOf('.');
    const nameWithoutExt = dotIndex > 0 ? file.name.substring(0, dotIndex) : file.name;
    setPendingUploadName(nameWithoutExt);
  };

  const confirmUpload = () => {
    if (pendingUploadFile) {
      const dotIndex = pendingUploadFile.name.lastIndexOf('.');
      const ext = dotIndex > 0 ? pendingUploadFile.name.substring(dotIndex) : '';
      const finalName = pendingUploadName.trim() ? `${pendingUploadName.trim()}${ext}` : pendingUploadFile.name;
      onUploadFile(pendingUploadFile, finalName);
      setPendingUploadFile(null);
      setPendingUploadName('');
    }
  };

  const cancelUpload = () => {
    setPendingUploadFile(null);
    setPendingUploadName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) initiateUpload(file);
  }, []);

  const handleCopyLink = () => {
    if (!evidenceLink) return;
    navigator.clipboard.writeText(evidenceLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const handlePasteUrlSubmit = async () => {
    if (!pasteUrl.trim()) return;
    const url = pasteUrl.trim();
    onChangeLink(url);
    if (url.includes('drive.google.com')) {
      await onCopyFromUrl(url, evidenceName || '');
    } else {
      if (onAddHistory) onAddHistory('ditautkan', evidenceName || 'Tautan Eksternal', url);
    }
    setPasteUrl('');
  };

  const getDirectDownloadUrl = (url: string) => {
    const id = extractDriveFileId(url);
    if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
    return url;
  };

  const startRename = () => {
    setRenameValue(evidenceName || '');
    setIsRenamingDoc(true);
  };

  const saveRename = () => {
    if (renameValue.trim()) {
      onChangeName(renameValue.trim());
      if (onAddHistory) onAddHistory('diubah', renameValue.trim(), evidenceLink || '');
    }
    setIsRenamingDoc(false);
  };

  return (
    <>
      <div className="mt-4 pt-3.5 border-t border-dark-gray/10 space-y-3">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-extrabold text-dark-gray text-[10.5px] block uppercase tracking-wide">
              📎 Bukti Dokumen
            </span>
            <p className="text-[9px] text-dark-gray/55 font-semibold mt-0.5">
              Upload langsung atau tempel tautan Google Drive
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {evidenceHistory.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  showHistory
                    ? 'bg-baby-blue text-dark-gray border-baby-blue/50'
                    : 'bg-white text-dark-gray/60 border-dark-gray/15 hover:bg-baby-blue/30'
                }`}
                title="Riwayat dokumen"
              >
                <History className="w-3 h-3" />
                {evidenceHistory.length} Riwayat
              </button>
            )}
            {hasEvidence && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Terlampir
              </span>
            )}
          </div>
        </div>

        {/* Upload History Panel */}
        {showHistory && evidenceHistory.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5">
              <History className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Riwayat Unggah Dokumen</span>
            </div>
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {[...evidenceHistory].reverse().map((entry, idx) => {
                const entryFileInfo = getFileIcon(entry.name);
                const EntryIcon = entry.action === 'dihapus' ? X : entryFileInfo.icon;
                const bgClass = entry.action === 'dihapus' ? 'bg-red-50' : entryFileInfo.bg;
                const colorClass = entry.action === 'dihapus' ? 'text-red-500' : entryFileInfo.color;

                return (
                  <div key={idx} className={`flex items-start gap-2.5 px-3 py-2.5 hover:bg-white transition-colors ${entry.action === 'dihapus' ? 'opacity-75' : ''}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${bgClass}`}>
                      <EntryIcon className={`w-3.5 h-3.5 ${colorClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      {entry.action === 'dihapus' || !entry.link ? (
                        <span className={`text-[10px] font-bold truncate block ${entry.action === 'dihapus' ? 'text-red-700 line-through' : 'text-slate-700'}`}>
                          {entry.name || 'Dokumen Tanpa Nama'}
                        </span>
                      ) : (
                        <a
                          href={entry.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-blue-700 hover:underline truncate block"
                        >
                          {entry.name || 'Dokumen Tanpa Nama'}
                        </a>
                      )}
                      <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                        <p className="text-[9px] text-slate-400 font-medium">
                          {formatDateTime(entry.uploadedAt)} · {entry.uploadedBy}
                        </p>
                        {entry.action && (
                          <span className={`text-[8px] font-bold px-1.5 rounded uppercase tracking-wider ${
                            entry.action === 'diunggah' ? 'bg-emerald-100 text-emerald-700' :
                            entry.action === 'ditautkan' ? 'bg-blue-100 text-blue-700' :
                            entry.action === 'dihapus' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {entry.action}
                          </span>
                        )}
                      </div>
                    </div>
                    {idx === 0 && entry.action !== 'dihapus' && (
                      <span className="text-[8px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">
                        TERKINI
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Evidence Card — shown when file is attached */}
        {hasEvidence ? (
          <div className="bg-gradient-to-br from-white to-slate-50/50 border border-dark-gray/12 rounded-2xl overflow-hidden shadow-sm">
            
            {/* File Header Strip */}
            <div className="flex items-center gap-3 p-3 border-b border-dark-gray/8">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${fileInfo.bg} border border-dark-gray/10`}>
                <FileIcon className={`w-4.5 h-4.5 ${fileInfo.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                {isRenamingDoc ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setIsRenamingDoc(false); }}
                      autoFocus
                      className="flex-1 text-xs font-extrabold text-dark-gray border border-peach-accent/50 rounded-lg px-2 py-0.5 bg-white outline-none focus:ring-1 focus:ring-peach-accent/30"
                    />
                    <button onClick={saveRename} className="w-6 h-6 rounded-md bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 cursor-pointer">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsRenamingDoc(false)} className="w-6 h-6 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-dark-gray truncate leading-tight flex-1">
                      {evidenceName || 'Dokumen Bukti'}
                    </p>
                    {isAuditor && !isReadOnly && (
                      <button
                        onClick={startRename}
                        className="p-0.5 text-dark-gray/30 hover:text-dark-gray/70 transition-colors cursor-pointer"
                        title="Ganti nama dokumen"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
                <p className="text-[9.5px] text-dark-gray/50 font-semibold mt-0.5 truncate">
                  {isDriveLink ? '🔗 Google Drive' : '🌐 Tautan Eksternal'} · {fileInfo.label}
                </p>
              </div>
              {isAuditor && !isReadOnly && (
                <button
                  onClick={onClear}
                  className="text-dark-gray/35 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Hapus item"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 p-2.5 flex-wrap">
              {/* Preview Button */}
              {embedUrl && (
                <button
                  onClick={() => setShowPreviewModal(true)}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold bg-baby-blue/60 hover:bg-baby-blue text-dark-gray border border-baby-blue/50 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              )}

              {/* Open in Drive */}
              <a
                href={evidenceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-extrabold bg-white hover:bg-peach-accent/40 text-dark-gray border border-dark-gray/15 px-3 py-1.5 rounded-lg transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Buka
              </a>

              {/* Download */}
              {isDriveLink && (
                <a
                  href={getDirectDownloadUrl(evidenceLink!)}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg transition-all"
                  title="Unduh berkas"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh
                </a>
              )}

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className={`flex items-center gap-1.5 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all cursor-pointer border ${
                  linkCopied
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'bg-white hover:bg-slate-50 text-dark-gray/70 border-dark-gray/15'
                }`}
                title="Salin tautan"
              >
                {linkCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {linkCopied ? 'Disalin!' : 'Salin Tautan'}
              </button>
            </div>

            {/* Link URL strip */}
            <div className="px-3 pb-3">
              <div className="bg-dark-gray/4 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                <Link2 className="w-3 h-3 text-dark-gray/40 flex-shrink-0" />
                <span className="text-[9px] font-mono text-dark-gray/50 truncate">{evidenceLink}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Upload Zone — shown when no file attached */
          isAuditor && !isReadOnly ? (
            <div className="space-y-2">
              {/* Tab Switcher */}
              <div className="flex gap-1 bg-dark-gray/5 rounded-xl p-1">
                <button
                  onClick={() => setTab('upload')}
                  className={`flex-1 text-[10px] font-extrabold py-1.5 rounded-lg transition-all cursor-pointer ${
                    tab === 'upload'
                      ? 'bg-white text-dark-gray shadow-sm'
                      : 'text-dark-gray/50 hover:text-dark-gray'
                  }`}
                >
                  📤 Unggah File
                </button>
                <button
                  onClick={() => setTab('link')}
                  className={`flex-1 text-[10px] font-extrabold py-1.5 rounded-lg transition-all cursor-pointer ${
                    tab === 'link'
                      ? 'bg-white text-dark-gray shadow-sm'
                      : 'text-dark-gray/50 hover:text-dark-gray'
                  }`}
                >
                  🔗 Tempel Tautan
                </button>
              </div>

              {tab === 'upload' ? (
                /* Drag & Drop Upload Zone */
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                    isUploading
                      ? 'border-peach-accent/50 bg-peach-accent/5 cursor-wait'
                      : isDragOver
                      ? 'border-baby-blue bg-baby-blue/10 scale-[1.01]'
                      : 'border-dark-gray/15 bg-white/60 hover:border-peach-accent/50 hover:bg-peach-accent/5'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png,.gif,.webp,.csv,.txt,.zip,.rar"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 15 * 1024 * 1024) {
                          alert('Ukuran file maksimal 15 MB.');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          return;
                        }
                        initiateUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 text-peach-accent animate-spin" />
                      <p className="text-xs font-extrabold text-dark-gray">Mengunggah ke Google Drive...</p>
                      <p className="text-[9.5px] text-dark-gray/50">Harap tunggu sebentar</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isDragOver ? 'bg-baby-blue/30 scale-110' : 'bg-dark-gray/5'
                      }`}>
                        <Upload className={`w-5 h-5 transition-colors ${isDragOver ? 'text-blue-600' : 'text-dark-gray/40'}`} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-dark-gray">
                          {isDragOver ? 'Lepaskan untuk mengunggah' : 'Seret & lepas berkas disini'}
                        </p>
                        <p className="text-[9.5px] text-dark-gray/50 mt-0.5">
                          atau <span className="text-peach-accent font-extrabold underline">klik untuk memilih</span>
                        </p>
                        <p className="text-[9px] text-dark-gray/35 mt-1.5 font-semibold">
                          PDF · Excel · Word · Gambar — Maks. 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Paste URL Tab */
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tempel tautan Google Drive atau URL dokumen..."
                      value={pasteUrl}
                      onChange={(e) => setPasteUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handlePasteUrlSubmit()}
                      className="flex-1 text-[10px] font-bold border border-dark-gray/15 px-3 py-2 rounded-xl bg-white text-dark-gray outline-none focus:border-peach-accent focus:ring-2 focus:ring-peach-accent/20"
                    />
                    <button
                      onClick={handlePasteUrlSubmit}
                      disabled={!pasteUrl.trim() || isCopying}
                      className="px-3 py-2 bg-dark-gray text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1.5 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-dark-gray/85 transition-colors"
                    >
                      {isCopying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                      {isCopying ? 'Menyalin...' : 'Simpan'}
                    </button>
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Nama / nomor berkas (opsional)..."
                      value={evidenceName || ''}
                      onChange={(e) => onChangeName(e.target.value)}
                      className="w-full text-[10px] font-bold border border-dark-gray/15 px-3 py-2 rounded-xl bg-white text-dark-gray outline-none focus:border-peach-accent focus:ring-2 focus:ring-peach-accent/20"
                    />
                  </div>
                  <div className="flex items-start gap-1.5 text-[9.5px] text-dark-gray/50 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2">
                    <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span>Jika tautan dari Drive orang lain, pastikan izin aksesnya sudah disetel ke <strong>"Anyone with the link can view"</strong></span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Read-only empty state */
            <div className="flex items-center gap-2 bg-dark-gray/4 rounded-xl px-3 py-2.5 border border-dark-gray/8">
              <File className="w-4 h-4 text-dark-gray/30" />
              <span className="text-[10.5px] text-dark-gray/45 italic font-semibold">Belum ada dokumen bukti yang dilampirkan.</span>
            </div>
          )
        )}
      </div>

      {/* === PREVIEW MODAL === */}
      {showPreviewModal && evidenceLink && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-dark-gray/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setShowPreviewModal(false)}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-dark-gray text-white flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${fileInfo.bg}`}>
                <FileIcon className={`w-3.5 h-3.5 ${fileInfo.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-white truncate">{evidenceName || 'Dokumen Bukti'}</p>
                <p className="text-[9px] text-white/50 font-semibold">Preview Dokumen</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Download in modal */}
              {isDriveLink && (
                <a
                  href={getDirectDownloadUrl(evidenceLink)}
                  className="flex items-center gap-1.5 text-[10px] font-extrabold bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </a>
              )}
              {/* Open full in Drive */}
              <a
                href={evidenceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-extrabold bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-lg transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Drive</span>
              </a>
              {/* Close */}
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-rose-500 text-white rounded-lg transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Preview Area */}
          <div className="flex-1 overflow-hidden relative bg-neutral-900">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                allow="autoplay"
                title="Preview Dokumen"
                loading="lazy"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/60 gap-3">
                <File className="w-16 h-16 opacity-30" />
                <p className="text-sm font-bold">Preview tidak tersedia untuk jenis berkas ini</p>
                <a
                  href={evidenceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-extrabold transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka di Browser
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rename before upload modal */}
      {pendingUploadFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-2 text-slate-800">
              <Pencil className="w-4 h-4" />
              <h3 className="font-bold text-sm">Ganti Nama Dokumen</h3>
            </div>
            <p className="text-[10px] text-slate-500 mb-4 font-medium leading-relaxed">
              Silakan ubah nama dokumen sebelum mengunggah. (Ekstensi <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{pendingUploadFile.name.substring(pendingUploadFile.name.lastIndexOf('.'))}</code> akan dipertahankan otomatis).
            </p>
            <input 
              type="text" 
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 mb-5 focus:ring-2 focus:ring-peach-accent focus:border-peach-accent outline-none"
              value={pendingUploadName}
              onChange={e => setPendingUploadName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && confirmUpload()}
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={cancelUpload} 
                className="px-4 py-2 text-[10px] font-extrabold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button 
                onClick={confirmUpload} 
                className="px-4 py-2 text-[10px] font-extrabold text-white bg-slate-800 rounded-lg hover:bg-slate-900 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Konfirmasi & Unggah
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
