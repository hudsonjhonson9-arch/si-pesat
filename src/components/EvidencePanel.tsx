import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, FileSpreadsheet, File, Image, Link2, Loader2, AlertTriangle, Eye, ExternalLink, Download, Copy, CheckCircle2, Edit2 } from 'lucide-react';
import { EvidenceFile } from '../types';

interface EvidencePanelProps {
  evidenceFiles?: EvidenceFile[];
  isReadOnly?: boolean;
  isAuditor?: boolean;
  onUploadFile: (file: File, newName?: string) => Promise<void>;
  onUploadFolder: (files: File[]) => Promise<void>;
  onCopyFromUrl: (url: string, name: string) => Promise<void>;
  onChangeLink: (link: string) => void;
  onChangeName: (name: string) => void;
  onClear: () => void;
  isUploading?: boolean;
  isCopying?: boolean;
}

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

function toEmbedUrl(url: string): string | null {
  if (url.includes('docs.google.com/spreadsheets')) {
    const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/spreadsheets/d/${m[1]}/htmlview?embedded=true`;
  }
  if (url.includes('docs.google.com/document')) {
    const m = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/document/d/${m[1]}/preview`;
  }
  if (url.includes('docs.google.com/presentation')) {
    const m = url.match(/\/presentation\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://docs.google.com/presentation/d/${m[1]}/preview`;
  }
  const id = extractDriveFileId(url);
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  const ext = url.split('.').pop()?.toLowerCase();
  if (ext && ['xlsx', 'xls', 'docx', 'doc', 'pptx', 'ppt'].includes(ext)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
  }
  return null;
}

function getFileIcon(name?: string, url?: string) {
  const src = name || url || '';
  const ext = src.split('.').pop()?.toLowerCase() || '';
  if (url?.includes('docs.google.com/spreadsheets')) return { icon: FileSpreadsheet, color: 'text-emerald-600', label: 'Spreadsheet' };
  if (url?.includes('docs.google.com/document')) return { icon: FileText, color: 'text-blue-600', label: 'Dokumen' };
  if (url?.includes('docs.google.com/presentation')) return { icon: FileText, color: 'text-amber-600', label: 'Slide' };
  if (['pdf'].includes(ext)) return { icon: FileText, color: 'text-red-500', label: 'PDF' };
  if (['xlsx', 'xls', 'csv'].includes(ext)) return { icon: FileSpreadsheet, color: 'text-emerald-600', label: 'Excel' };
  if (['docx', 'doc'].includes(ext)) return { icon: FileText, color: 'text-blue-600', label: 'Word' };
  if (['pptx', 'ppt'].includes(ext)) return { icon: FileText, color: 'text-amber-600', label: 'PowerPoint' };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { icon: Image, color: 'text-purple-600', label: 'Gambar' };
  return { icon: File, color: 'text-dark-gray/60', label: 'Berkas' };
}

function getDirectDownloadUrl(url: string) {
  const id = extractDriveFileId(url);
  if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
  return url;
}

export default function EvidencePanel({
  evidenceFiles,
  isReadOnly = false,
  isAuditor = true,
  onUploadFile,
  onUploadFolder,
  onCopyFromUrl,
  onChangeLink,
  onChangeName,
  onClear,
  isUploading = false,
  isCopying = false,
}: EvidencePanelProps) {
  const [pasteUrl, setPasteUrl] = useState('');
  const [isEditName, setIsEditName] = useState(false);
  const [editNameVal, setEditNameVal] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [tab, setTab] = useState<'upload' | 'link'>('upload');
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [pendingUploadName, setPendingUploadName] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [isDragFolder, setIsDragFolder] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const singleFile = evidenceFiles && evidenceFiles.length === 1 ? evidenceFiles[0] : null;
  const currentEvidenceLink = singleFile?.link ?? '';
  const currentEvidenceName = singleFile?.name ?? '';
  const embedUrl = currentEvidenceLink ? toEmbedUrl(currentEvidenceLink) : null;
  const isDriveLink = currentEvidenceLink?.includes('drive.google.com');
  const fileInfo = getFileIcon(currentEvidenceName, currentEvidenceLink);
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
    setIsDragFolder(false);
    const items = e.dataTransfer.items;
    if (items.length > 0) {
      const entry = items[0].webkitGetAsEntry?.();
      if (entry?.isDirectory) {
        const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.size > 0);
        if (files.length > 0) onUploadFolder(files);
        return;
      }
    }
    const file = e.dataTransfer.files[0];
    if (file) initiateUpload(file);
  }, [onUploadFolder]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    if (e.dataTransfer.items?.[0]?.webkitGetAsEntry?.()?.isDirectory) {
      setIsDragFolder(true);
    } else {
      setIsDragFolder(false);
    }
  }, []);

  const handleClickUpload = () => {
    if (isUploading) return;
    setShowFolderPicker(true);
  };

  const handlePasteUrlSubmit = async () => {
    if (!pasteUrl.trim()) return;
    const url = pasteUrl.trim();
    onChangeLink(url);
    if (url.includes('drive.google.com')) {
      await onCopyFromUrl(url, currentEvidenceName || '');
    }
    setPasteUrl('');
  };

  const handleCopyLink = () => {
    if (!currentEvidenceLink) return;
    navigator.clipboard.writeText(currentEvidenceLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const previewUrl = previewFile?.link || currentEvidenceLink;

  return (
    <div className="mt-3 pt-3 border-t border-dark-gray/10 space-y-3">
      <span className="text-[10px] font-bold text-dark-gray/60 uppercase tracking-wide flex items-center gap-1">
        <Link2 className="w-3 h-3" /> Bukti Dokumen
      </span>

      {evidenceFiles && evidenceFiles.length > 1 ? (
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-dark-gray/60">{evidenceFiles.length} dokumen</span>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {[...evidenceFiles].sort((a, b) => a.relativePath.localeCompare(b.relativePath)).map((ef) => {
              const info = getFileIcon(ef.name, ef.link);
              const Icon = info.icon;
              const pathParts = ef.relativePath.split('/');
              const displayPath = pathParts.length > 1 ? pathParts.slice(0, -1).join(' / ') : '';
              return (
                <div key={ef.id} className="flex items-center gap-2 bg-violet-50/40 border border-violet-200/40 rounded-lg px-2.5 py-1.5">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-violet-100">
                    <Icon className={`w-3 h-3 ${info.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-dark-gray truncate">{ef.name}</p>
                    {displayPath && <p className="text-[8px] text-dark-gray/40 truncate">{displayPath}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {toEmbedUrl(ef.link) && (
                      <button onClick={() => setPreviewFile(ef)}
                        className="p-1.5 text-dark-gray/50 hover:text-dark-gray hover:bg-violet-100 rounded-lg cursor-pointer" title="Preview">
                        <Eye className="w-3 h-3" />
                      </button>
                    )}
                    <a href={ef.link} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 text-dark-gray/50 hover:text-dark-gray hover:bg-violet-100 rounded-lg" title="Buka Drive">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
          {isAuditor && !isReadOnly && (
            <button onClick={onClear} className="text-[9px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer">
              Hapus Semua Dokumen
            </button>
          )}
        </div>
      ) : singleFile ? (
        <>
          <div className="flex items-center gap-2 bg-violet-50/60 border border-violet-200/60 rounded-lg px-3 py-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-violet-100">
              <FileIcon className={`w-3.5 h-3.5 ${fileInfo.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {isEditName ? (
                  <input type="text" value={editNameVal}
                    onChange={e => setEditNameVal(e.target.value)}
                    onBlur={() => { if (editNameVal.trim()) onChangeName(editNameVal.trim()); setIsEditName(false); }}
                    onKeyDown={e => { if (e.key === 'Enter') { if (editNameVal.trim()) onChangeName(editNameVal.trim()); setIsEditName(false); } if (e.key === 'Escape') setIsEditName(false); }}
                    className="text-xs font-bold text-dark-gray border border-dark-gray/30 rounded px-1 py-0.5 w-full outline-none" autoFocus />
                ) : (
                  <p className="text-xs font-bold text-dark-gray truncate">{currentEvidenceName || 'Dokumen Bukti'}</p>
                )}
                {isAuditor && !isReadOnly && !isEditName && (
                  <button onClick={() => { setIsEditName(true); setEditNameVal(currentEvidenceName || ''); }} className="p-1 text-violet-500 hover:text-violet-700 hover:bg-violet-100 rounded cursor-pointer shrink-0" title="Edit nama dokumen"><Edit2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
              <p className="text-[9px] text-violet-600/50 truncate">{currentEvidenceLink}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {embedUrl && (
              <button onClick={() => setShowPreviewModal(true)}
                className="flex items-center gap-1 text-[10px] font-extrabold bg-baby-blue/60 hover:bg-baby-blue text-dark-gray border border-baby-blue/50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer">
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
            )}
            <a href={currentEvidenceLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] font-extrabold bg-white hover:bg-peach-accent/40 text-dark-gray border border-dark-gray/15 px-2.5 py-1.5 rounded-lg transition-all">
              <ExternalLink className="w-3.5 h-3.5" /> Buka
            </a>
            {isDriveLink && (
              <a href={getDirectDownloadUrl(currentEvidenceLink)} download
                className="flex items-center gap-1 text-[10px] font-extrabold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition-all">
                <Download className="w-3.5 h-3.5" /> Unduh
              </a>
            )}
            <button onClick={handleCopyLink}
              className={`flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer border ${linkCopied ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white hover:bg-slate-50 text-dark-gray/70 border-dark-gray/15'}`}>
              {linkCopied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {linkCopied ? 'Disalin!' : 'Salin Tautan'}
            </button>
            {isAuditor && !isReadOnly && (
              <button onClick={onClear}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 px-2.5 py-1.5 cursor-pointer">
                Hapus Dokumen
              </button>
            )}
          </div>
        </>
      ) : isAuditor && !isReadOnly ? (
        <div className="space-y-2">
          <div className="flex gap-1 bg-dark-gray/5 rounded-xl p-1">
            <button onClick={() => setTab('upload')}
              className={`flex-1 text-[10px] font-extrabold py-1.5 rounded-lg transition-all cursor-pointer ${tab === 'upload' ? 'bg-white text-dark-gray shadow-sm' : 'text-dark-gray/50 hover:text-dark-gray'}`}>
              Unggah File
            </button>
            <button onClick={() => setTab('link')}
              className={`flex-1 text-[10px] font-extrabold py-1.5 rounded-lg transition-all cursor-pointer ${tab === 'link' ? 'bg-white text-dark-gray shadow-sm' : 'text-dark-gray/50 hover:text-dark-gray'}`}>
              Tempel Tautan
            </button>
          </div>

          {tab === 'upload' ? (
            <div onDragOver={handleDragOver} onDragLeave={() => setIsDragOver(false)} onDrop={handleDrop}
              onClick={handleClickUpload}
              className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${isUploading ? 'border-peach-accent/50 bg-peach-accent/5 cursor-wait' : isDragOver ? 'border-baby-blue bg-baby-blue/10' : 'border-dark-gray/15 bg-white hover:border-peach-accent/50 hover:bg-peach-accent/5'}`}>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.jpg,.jpeg,.png,.gif,.webp,.csv,.txt,.zip,.rar" disabled={isUploading}
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  if (files.length === 1) {
                    const file = files[0];
                    if (file.size > 15 * 1024 * 1024) { alert('Ukuran file maksimal 15 MB.'); if (fileInputRef.current) fileInputRef.current.value = ''; return; }
                    initiateUpload(file);
                  } else {
                    const validFiles = Array.from(files).filter(f => f.size > 0);
                    if (validFiles.length > 0) { onUploadFolder(validFiles); if (fileInputRef.current) fileInputRef.current.value = ''; }
                  }
                }} className="hidden" />
              <input ref={folderInputRef} type="file" webkitdirectory="true" className="hidden"
                onChange={(e) => {
                  const files = e.target.files ? (Array.from(e.target.files) as File[]).filter(f => f.size > 0) : [];
                  if (files.length > 0) { onUploadFolder(files); if (folderInputRef.current) folderInputRef.current.value = ''; }
                }} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-1.5"><Loader2 className="w-5 h-5 text-peach-accent animate-spin" /><p className="text-[10px] font-bold text-dark-gray">Mengunggah...</p></div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="w-4 h-4 text-dark-gray/40" />
                  <p className="text-[10px] font-bold text-dark-gray">{isDragOver ? (isDragFolder ? 'Lepaskan folder untuk mengunggah' : 'Lepaskan untuk mengunggah') : 'Seret atau klik untuk unggah'}</p>
                  <p className="text-[8px] text-dark-gray/40">PDF, Excel, Word, Gambar — Maks. 15MB</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" placeholder="Tempel tautan Google Drive..." value={pasteUrl}
                  onChange={(e) => setPasteUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handlePasteUrlSubmit()}
                  className="flex-1 text-[10px] font-bold border border-dark-gray/15 px-3 py-2 rounded-lg bg-white text-dark-gray outline-none focus:border-peach-accent" />
                <button onClick={handlePasteUrlSubmit} disabled={!pasteUrl.trim() || isCopying}
                  className="px-3 py-2 bg-dark-gray text-white rounded-lg text-[10px] font-extrabold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
                  {isCopying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Simpan'}
                </button>
              </div>
              <div className="flex items-start gap-1.5 text-[9px] text-dark-gray/50 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0 mt-0.5" />
                <span>Pastikan izin aksesnya sudah "Anyone with the link can view"</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-dark-gray/4 rounded-lg px-3 py-2 border border-dark-gray/8">
          <File className="w-4 h-4 text-dark-gray/30" />
          <span className="text-[10px] text-dark-gray/45 italic">Belum ada dokumen bukti</span>
        </div>
      )}

      {showFolderPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowFolderPicker(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xs w-full p-5" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-sm mb-4">Pilih jenis upload</h3>
            <div className="space-y-2">
              <button onClick={() => { setShowFolderPicker(false); fileInputRef.current?.click(); }}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:bg-peach-accent/10 font-bold text-xs flex items-center gap-3 cursor-pointer">
                <Upload className="w-4 h-4" /> Unggah File (1 atau banyak)
              </button>
              <button onClick={() => { setShowFolderPicker(false); folderInputRef.current?.click(); }}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:bg-peach-accent/10 font-bold text-xs flex items-center gap-3 cursor-pointer">
                <Upload className="w-4 h-4" /> Unggah Semua Isi Folder
              </button>
              <button onClick={() => setShowFolderPicker(false)} className="w-full text-center py-2 text-[10px] font-bold text-slate-500 cursor-pointer">Batal</button>
            </div>
          </div>
        </div>
      )}

      {pendingUploadFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5">
            <div className="flex items-center gap-2 mb-2 text-slate-800"><h3 className="font-bold text-sm">Ganti Nama Dokumen</h3></div>
            <p className="text-[10px] text-slate-500 mb-4 font-medium">Ubah nama dokumen sebelum mengunggah.</p>
            <input type="text" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 mb-5 focus:ring-2 focus:ring-peach-accent outline-none"
              value={pendingUploadName} onChange={e => setPendingUploadName(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && confirmUpload()} />
            <div className="flex gap-2 justify-end">
              <button onClick={cancelUpload} className="px-4 py-2 text-[10px] font-extrabold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">Batal</button>
              <button onClick={confirmUpload} className="px-4 py-2 text-[10px] font-extrabold text-white bg-slate-800 rounded-lg hover:bg-slate-900 flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Konfirmasi & Unggah
              </button>
            </div>
          </div>
        </div>
      )}

      {(showPreviewModal || previewFile) && previewUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-dark-gray/80 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) { setShowPreviewModal(false); setPreviewFile(null); } }}>
          <div className="flex items-center justify-between px-4 py-3 bg-dark-gray text-white flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/10">{(() => { const pi = getFileIcon(previewFile?.name || currentEvidenceName, previewUrl); const PI = pi.icon; return <PI className={`w-3.5 h-3.5 ${pi.color}`} />; })()}</div>
              <div className="min-w-0"><p className="text-xs font-extrabold text-white truncate">{previewFile?.name || currentEvidenceName || 'Dokumen Bukti'}</p><p className="text-[9px] text-white/50 font-semibold">Preview Dokumen</p></div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {previewUrl.includes('drive.google.com') && (
                <a href={getDirectDownloadUrl(previewUrl)} className="flex items-center gap-1.5 text-[10px] font-extrabold bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-lg transition-all">
                  <Download className="w-3.5 h-3.5" /><span>Unduh</span>
                </a>
              )}
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] font-extrabold bg-white/10 hover:bg-white/20 text-white border border-white/20 px-2.5 py-1.5 rounded-lg transition-all">
                <ExternalLink className="w-3.5 h-3.5" /><span>Buka Drive</span>
              </a>
              <button onClick={() => { setShowPreviewModal(false); setPreviewFile(null); }} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-rose-500 text-white rounded-lg transition-all cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative bg-neutral-900">
            {(() => { const mu = toEmbedUrl(previewUrl); return mu ? (
              <iframe src={mu} className="w-full h-full border-0" allow="autoplay" title="Preview Dokumen" loading="lazy" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/60 gap-3">
                <File className="w-16 h-16 opacity-30" />
                <p className="text-sm font-bold">Preview tidak tersedia</p>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-extrabold transition-all">
                  <ExternalLink className="w-4 h-4" /> Buka di Browser
                </a>
              </div>
            ); })()}
          </div>
        </div>
      )}
    </div>
  );
}
