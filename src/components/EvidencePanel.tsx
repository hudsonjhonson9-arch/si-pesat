import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, FileSpreadsheet, File, Image, Link2, Loader2, AlertTriangle } from 'lucide-react';

interface EvidencePanelProps {
  evidenceLink?: string;
  evidenceName?: string;
  isReadOnly?: boolean;
  isAuditor?: boolean;
  onUploadFile: (file: File, newName?: string) => Promise<void>;
  onCopyFromUrl: (url: string, name: string) => Promise<void>;
  onChangeLink: (link: string) => void;
  onChangeName: (name: string) => void;
  onClear: () => void;
  isUploading?: boolean;
  isCopying?: boolean;
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
  const [pasteUrl, setPasteUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [tab, setTab] = useState<'upload' | 'link'>('upload');
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [pendingUploadName, setPendingUploadName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasEvidence = !!(evidenceLink);
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

  const handlePasteUrlSubmit = async () => {
    if (!pasteUrl.trim()) return;
    const url = pasteUrl.trim();
    onChangeLink(url);
    if (url.includes('drive.google.com')) {
      await onCopyFromUrl(url, evidenceName || '');
    }
    setPasteUrl('');
  };

  return (
    <div className="mt-3 pt-3 border-t border-dark-gray/10 space-y-3">
      <span className="text-[10px] font-bold text-dark-gray/60 uppercase tracking-wide flex items-center gap-1">
        <Link2 className="w-3 h-3" /> Bukti Dokumen
      </span>

      {hasEvidence ? (
        <div className="flex items-center gap-2 bg-white/60 border border-dark-gray/10 rounded-lg px-3 py-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-dark-gray/5">
            <FileIcon className={`w-3.5 h-3.5 ${fileInfo.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-dark-gray truncate">{evidenceName || 'Dokumen Bukti'}</p>
            <p className="text-[9px] text-dark-gray/50 truncate">{evidenceLink}</p>
          </div>
          <a
            href={evidenceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-blue-600 hover:underline shrink-0"
          >
            Buka
          </a>
          {isAuditor && !isReadOnly && (
            <button
              onClick={onClear}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-800 shrink-0 cursor-pointer"
            >
              Hapus
            </button>
          )}
        </div>
      ) : isAuditor && !isReadOnly ? (
        <div className="space-y-2">
          <div className="flex gap-1 bg-dark-gray/5 rounded-xl p-1">
            <button
              onClick={() => setTab('upload')}
              className={`flex-1 text-[10px] font-extrabold py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === 'upload'
                  ? 'bg-white text-dark-gray shadow-sm'
                  : 'text-dark-gray/50 hover:text-dark-gray'
              }`}
            >
              Unggah File
            </button>
            <button
              onClick={() => setTab('link')}
              className={`flex-1 text-[10px] font-extrabold py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === 'link'
                  ? 'bg-white text-dark-gray shadow-sm'
                  : 'text-dark-gray/50 hover:text-dark-gray'
              }`}
            >
              Tempel Tautan
            </button>
          </div>

          {tab === 'upload' ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                isUploading
                  ? 'border-peach-accent/50 bg-peach-accent/5 cursor-wait'
                  : isDragOver
                  ? 'border-baby-blue bg-baby-blue/10'
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
                <div className="flex flex-col items-center gap-1.5">
                  <Loader2 className="w-5 h-5 text-peach-accent animate-spin" />
                  <p className="text-[10px] font-bold text-dark-gray">Mengunggah...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <Upload className="w-4 h-4 text-dark-gray/40" />
                  <p className="text-[10px] font-bold text-dark-gray">
                    {isDragOver ? 'Lepaskan untuk mengunggah' : 'Seret atau klik untuk unggah'}
                  </p>
                  <p className="text-[8px] text-dark-gray/40">PDF, Excel, Word, Gambar — Maks. 15MB</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tempel tautan Google Drive..."
                  value={pasteUrl}
                  onChange={(e) => setPasteUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasteUrlSubmit()}
                  className="flex-1 text-[10px] font-bold border border-dark-gray/15 px-3 py-2 rounded-lg bg-white text-dark-gray outline-none focus:border-peach-accent"
                />
                <button
                  onClick={handlePasteUrlSubmit}
                  disabled={!pasteUrl.trim() || isCopying}
                  className="px-3 py-2 bg-dark-gray text-white rounded-lg text-[10px] font-extrabold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
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

      {pendingUploadFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-5">
            <div className="flex items-center gap-2 mb-2 text-slate-800">
              <h3 className="font-bold text-sm">Ganti Nama Dokumen</h3>
            </div>
            <p className="text-[10px] text-slate-500 mb-4 font-medium">
              Ubah nama dokumen sebelum mengunggah.
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
    </div>
  );
}
