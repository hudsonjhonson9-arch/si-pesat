/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Eye, Download, ExternalLink, FileText, FileSpreadsheet, File, Image, Link2, Copy, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';

interface EvidencePanelProps {
  evidenceLink?: string;
  evidenceName?: string;
  isReadOnly?: boolean;
  isAuditor?: boolean;
  onUploadFile: (file: File) => Promise<void>;
  onCopyFromUrl: (url: string, name: string) => Promise<void>;
  onChangeLink: (link: string) => void;
  onChangeName: (name: string) => void;
  onClear: () => void;
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

// Convert a GDrive view URL to an embed/preview URL
function toEmbedUrl(url: string): string | null {
  const id = extractDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/file/d/${id}/preview`;
}

// Get file type icon & color based on name/url
function getFileIcon(name?: string, url?: string) {
  const ext = (name || url || '').split('.').pop()?.toLowerCase() || '';
  if (['pdf'].includes(ext)) return { icon: FileText, color: 'text-red-500', bg: 'bg-red-50', label: 'PDF' };
  if (['xlsx', 'xls', 'csv'].includes(ext)) return { icon: FileSpreadsheet, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Excel' };
  if (['docx', 'doc'].includes(ext)) return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Word' };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { icon: Image, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Gambar' };
  return { icon: File, color: 'text-dark-gray/60', bg: 'bg-dark-gray/5', label: 'Berkas' };
}

export default function EvidencePanel({
  evidenceLink,
  evidenceName,
  isReadOnly = false,
  isAuditor = true,
  onUploadFile,
  onCopyFromUrl,
  onChangeLink,
  onChangeName,
  onClear,
  isUploading = false,
  isCopying = false,
}: EvidencePanelProps) {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [pasteUrl, setPasteUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [tab, setTab] = useState<'upload' | 'link'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasEvidence = !!(evidenceLink);
  const embedUrl = evidenceLink ? toEmbedUrl(evidenceLink) : null;
  const isDriveLink = evidenceLink?.includes('drive.google.com');
  const fileInfo = getFileIcon(evidenceName, evidenceLink);
  const FileIcon = fileInfo.icon;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onUploadFile(file);
  }, [onUploadFile]);

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
    }
    setPasteUrl('');
  };

  const getDirectDownloadUrl = (url: string) => {
    const id = extractDriveFileId(url);
    if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
    return url;
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
          {hasEvidence && (
            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Terlampir
            </span>
          )}
        </div>

        {/* Evidence Card — shown when file is attached */}
        {hasEvidence ? (
          <div className="bg-gradient-to-br from-white to-slate-50/50 border border-dark-gray/12 rounded-2xl overflow-hidden shadow-sm">
            
            {/* File Header Strip */}
            <div className="flex items-center gap-3 p-3 border-b border-dark-gray/8">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${fileInfo.bg} border border-dark-gray/10`}>
                <FileIcon className={`w-4.5 h-4.5 ${fileInfo.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-extrabold text-dark-gray truncate leading-tight">
                  {evidenceName || 'Dokumen Bukti'}
                </p>
                <p className="text-[9.5px] text-dark-gray/50 font-semibold mt-0.5 truncate">
                  {isDriveLink ? '🔗 Google Drive' : '🌐 Tautan Eksternal'} · {fileInfo.label}
                </p>
              </div>
              {isAuditor && !isReadOnly && (
                <button
                  onClick={onClear}
                  className="text-dark-gray/35 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50 cursor-pointer"
                  title="Hapus dokumen"
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
                    accept=".pdf,.xlsx,.xls,.docx,.doc,image/*"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) { onUploadFile(file); e.target.value = ''; }
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
                  <span className="hidden sm:inline">Unduh</span>
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
                <span className="hidden sm:inline">Buka Drive</span>
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
    </>
  );
}
