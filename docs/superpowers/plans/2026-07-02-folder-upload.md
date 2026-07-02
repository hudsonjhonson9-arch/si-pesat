# Folder Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable folder upload via browser in EvidencePanel with folder structure preservation in Google Drive and a folder viewer UI for multi-file evidence.

**Architecture:** add `EvidenceFile[]` to `AuditItem`, auto-migrate legacy `evidenceLink` data. Upload engine sends files in parallel (concurrency 3) to Google Apps Script with `subPath` for nested folder creation. EvidencePanel renders 3 states based on file count (0 = upload area, 1 = single file view, >1 = folder viewer).

**Tech Stack:** React 19, TypeScript 5.8, Google Apps Script, Google Drive API

## Global Constraints

- File size max 15MB per file (GAS limit)
- Backward compat: existing `evidenceLink`/`evidenceName` auto-migrated to `evidenceFiles[]`
- No new npm dependencies
- Concurrency limit 3 for parallel uploads
- Google Drive URL sebagai satu-satunya storage backend

---

### Task 1: Data Model & Auto-Migration

**Files:**
- Modify: `src/types.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `EvidenceFile` interface, updated `AuditItem` with `evidenceFiles?: EvidenceFile[]`
- Produces: auto-migration logic in App.tsx load effect

- [ ] **Step 1: Add EvidenceFile to types.ts**

```typescript
export interface EvidenceFile {
  id: string;
  name: string;
  link: string;
  relativePath: string;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
}
```

Add after `FindingStatus` type definition, before `AuditItem` (around line 11).

- [ ] **Step 2: Update AuditItem**

```typescript
export interface AuditItem {
  id: string;
  title: string;
  description: string;
  status: FindingStatus;
  nilaiTemuan: number;
  jenisTemuan?: string;
  uraianTemuan: string;
  rekomendasi: string;
  evidenceLink?: string;
  evidenceName?: string;
  evidenceFiles?: EvidenceFile[];
  evidenceHistory?: { name: string; link: string; uploadedAt: string; uploadedBy: string; action?: 'diunggah' | 'ditautkan' | 'dihapus' | 'diubah' }[];
  catatanReview?: string;
}
```

Note: `evidenceLink` and `evidenceName` kept for backward compat but no longer used by new code.

- [ ] **Step 3: Add auto-migration in App.tsx**

In the load effect (useEffect that reads localStorage and fetches from Supabase), add migration after setting audits:

```typescript
// ≈ line 267, after setAudits(parsed)
parsed = parsed.map((a: any) => ({
  ...a,
  categories: a.categories.map((cat: any) => ({
    ...cat,
    items: cat.items.map((item: any) => {
      if (item.evidenceLink && !item.evidenceFiles) {
        return {
          ...item,
          evidenceFiles: [{
            id: crypto.randomUUID?.() || `ev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            name: item.evidenceName || 'Dokumen Bukti',
            link: item.evidenceLink,
            relativePath: item.evidenceName || 'Dokumen Bukti',
            uploadedAt: new Date().toISOString(),
            uploadedBy: a.auditorName || 'Unknown',
            size: 0
          }]
        };
      }
      return item;
    })
  }))
}));
```

Same migration in the Supabase fetch handler (around line 216-231) — apply to `mapped` data.

- [ ] **Step 4: Verify no TypeScript errors**

Run: `npm run lint`

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/App.tsx
git commit -m "feat: add EvidenceFile type and auto-migration for folder upload"
```

---

### Task 2: Google Apps Script — subPath Support

**Files:**
- Modify: `google-apps-script.gs`

**Interfaces:**
- Produces: backend accepts optional `subPath` parameter for nested folder creation

- [ ] **Step 1: Add subPath handling in doPost**

After the existing folder creation block (≈ line 157, after `payload.auditType`), add:

```javascript
// subPath for nested folder structure from browser folder upload
if (payload.subPath) {
  var pathParts = payload.subPath.split('/').filter(function(p) { return p.trim() !== ''; });
  for (var i = 0; i < pathParts.length; i++) {
    currentFolder = getOrCreateFolder(currentFolder, pathParts[i]);
  }
}
```

This goes right before the `var file;` line (≈ line 159).

- [ ] **Step 2: Deploy**

Manual step: open script.google.com, paste updated code, Deploy > New deployment > Web app. Copy URL.

- [ ] **Step 3: Commit**

```bash
git add google-apps-script.gs
git commit -m "feat: add subPath param for nested folder upload"
```

---

### Task 3: Upload Engine — Folder Upload Helper

**Files:**
- Modify: `src/lib/googleDrive.ts`

**Interfaces:**
- Produces: `uploadFolderFiles(files: File[], auditInfo): Promise<EvidenceFile[]>`

- [ ] **Step 1: Add uploadFolderFiles function**

```typescript
export async function uploadFolderFiles(
  files: File[],
  auditInfo: { fiscalYear?: string; opdName?: string; auditType?: string; uploadedBy: string },
  onProgress?: (completed: number, total: number) => void
): Promise<EvidenceFile[]> {
  const baseUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  if (!baseUrl) {
    throw new Error('VITE_GOOGLE_SCRIPT_URL belum diatur.');
  }
  const token = await getAuthToken();
  const scriptUrl = baseUrl + '?token=' + encodeURIComponent(token);
  const CONCURRENCY = 3;
  const results: EvidenceFile[] = [];
  let completed = 0;

  const uploadOne = async (file: File): Promise<EvidenceFile> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const payload: any = {
            name: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64: base64Data,
            year: auditInfo.fiscalYear,
            opd: auditInfo.opdName,
            auditType: auditInfo.auditType,
          };
          // Preserve folder structure from webkitRelativePath
          if ('webkitRelativePath' in file && (file as any).webkitRelativePath) {
            const relPath = (file as any).webkitRelativePath;
            const parts = relPath.split('/');
            // parts[0] is the root folder name, parts.slice(1) is subpath
            if (parts.length > 1) {
              payload.subPath = parts.slice(1, -1).join('/'); // exclude root folder name and filename
            }
          }
          const resp = await fetch(scriptUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
          });
          if (!resp.ok) throw new Error(`Upload ${file.name} gagal: ${resp.status}`);
          const result = await resp.json();
          if (!result.success) throw new Error(result.error || `Upload ${file.name} gagal`);
          const relativePath = (file as any).webkitRelativePath || file.name;
          resolve({
            id: result.data.id,
            name: result.data.name,
            link: result.data.webViewLink,
            relativePath: relativePath,
            uploadedAt: new Date().toISOString(),
            uploadedBy: auditInfo.uploadedBy,
            size: file.size
          });
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  // Upload with concurrency limit
  const queue = [...files];
  async function worker() {
    while (queue.length > 0) {
      const file = queue.shift()!;
      const result = await uploadOne(file);
      results.push(result);
      completed++;
      onProgress?.(completed, files.length);
    }
  }
  const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npm run lint`

- [ ] **Step 3: Commit**

```bash
git add src/lib/googleDrive.ts
git commit -m "feat: add uploadFolderFiles with concurrency for folder upload"
```

---

### Task 4: EvidencePanel — Folder Viewer & Auto-Detect Upload

**Files:**
- Rewrite: `src/components/EvidencePanel.tsx`

**Interfaces:**
- Consumes: `EvidenceFile[]` from props
- Consumes: `onUploadFolder(files: File[])` callback
- Produces: folder viewer UI, auto-detect file vs folder upload

- [ ] **Step 1: Update EvidencePanelProps**

```typescript
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
```

Replace existing interface.

- [ ] **Step 2: Add state for folder detection**

Replace existing state declarations (lines 86-94):

```typescript
const [pasteUrl, setPasteUrl] = useState('');
const [isEditName, setIsEditName] = useState(false);
const [editNameVal, setEditNameVal] = useState('');
const [isDragOver, setIsDragOver] = useState(false);
const [tab, setTab] = useState<'upload' | 'link'>('upload');
const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
const [pendingUploadName, setPendingUploadName] = useState('');
const [showPreviewModal, setShowPreviewModal] = useState(false);
const [showFolderPicker, setShowFolderPicker] = useState(false);
const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);
const [linkCopied, setLinkCopied] = useState(false);
const [isDragFolder, setIsDragFolder] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
const folderInputRef = useRef<HTMLInputElement>(null);
```

- [ ] **Step 3: Update handleDrop for folder detection**

```typescript
const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(false);
  setIsDragFolder(false);
  const items = e.dataTransfer.items;
  if (items.length > 0) {
    const entry = items[0].webkitGetAsEntry?.();
    if (entry?.isDirectory) {
      // Folder dropped — use FileList from dataTransfer (webkitRelativePath available)
      const files = Array.from(e.dataTransfer.files).filter(f => f.size > 0);
      if (files.length > 0) onUploadFolder(files);
      return;
    }
  }
  // Single file dropped
  const file = e.dataTransfer.files[0];
  if (file) initiateUpload(file);
}, [onUploadFolder]);
```

Add `onDragOver` handler update:

```typescript
const handleDragOver = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(true);
  if (e.dataTransfer.items?.[0]?.webkitGetAsEntry?.()?.isDirectory) {
    setIsDragFolder(true);
  } else {
    setIsDragFolder(false);
  }
}, []);
```

- [ ] **Step 4: Add click handler with folder/file picker**

```typescript
const handleClickUpload = () => {
  if (isUploading) return;
  setShowFolderPicker(true);
};

const handleChooseFile = () => {
  setShowFolderPicker(false);
  fileInputRef.current?.click();
};

const handleChooseFolder = () => {
  setShowFolderPicker(false);
  folderInputRef.current?.click();
};
```

In the JSX upload area, replace `onClick={() => !isUploading && fileInputRef.current?.click()}` with `onClick={handleClickUpload}`.

Add the folder input (hidden):

```tsx
<input ref={folderInputRef} type="file" webkitdirectory="true" className="hidden"
  onChange={(e) => {
    const files = e.target.files ? Array.from(e.target.files).filter(f => f.size > 0) : [];
    if (files.length > 0) { onUploadFolder(files); if (folderInputRef.current) folderInputRef.current.value = ''; }
  }} />
```

Add folder picker modal:

```tsx
{showFolderPicker && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowFolderPicker(false)}>
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xs w-full p-5" onClick={e => e.stopPropagation()}>
      <h3 className="font-bold text-sm mb-4">Pilih jenis upload</h3>
      <div className="space-y-2">
        <button onClick={handleChooseFile} className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:bg-peach-accent/10 font-bold text-xs flex items-center gap-3 cursor-pointer">
          <Upload className="w-4 h-4" /> Unggah File
        </button>
        <button onClick={handleChooseFolder} className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:bg-peach-accent/10 font-bold text-xs flex items-center gap-3 cursor-pointer">
          <Folder className="w-4 h-4" /> Unggah Folder
        </button>
        <button onClick={() => setShowFolderPicker(false)} className="w-full text-center py-2 text-[10px] font-bold text-slate-500 cursor-pointer">Batal</button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 5: Add drag-over feedback for folder**

In upload area, show different message for folder drag:

```tsx
{isDragOver ? (
  <p className="text-[10px] font-bold text-dark-gray">
    {isDragFolder ? 'Lepaskan folder untuk mengunggah' : 'Lepaskan untuk mengunggah'}
  </p>
) : (
  <p className="text-[10px] font-bold text-dark-gray">Seret atau klik untuk unggah</p>
)}
```

- [ ] **Step 6: Update evidence render — 3-state logic**

Replace `{hasEvidence ? ...}` block (≈ line 158) completely:

```tsx
{evidenceFiles && evidenceFiles.length > 1 ? (
  /* Folder viewer */
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-dark-gray/60">{evidenceFiles.length} dokumen</span>
    </div>
    <div className="max-h-60 overflow-y-auto space-y-1">
      {[...evidenceFiles]
        .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
        .map((ef) => {
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
                    className="p-1.5 text-dark-gray/50 hover:text-dark-gray hover:bg-violet-100 rounded-lg cursor-pointer"
                    title="Preview"><Eye className="w-3 h-3" /></button>
                )}
                <a href={ef.link} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 text-dark-gray/50 hover:text-dark-gray hover:bg-violet-100 rounded-lg"
                  title="Buka Drive"><ExternalLink className="w-3 h-3" /></a>
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
) : evidenceFiles && evidenceFiles.length === 1 ? (
  /* Single file view (existing code, adapted to use evidenceFiles[0]) */
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
            <p className="text-xs font-bold text-dark-gray truncate">{evidenceFiles[0].name}</p>
          )}
          {isAuditor && !isReadOnly && !isEditName && (
            <button onClick={() => { setIsEditName(true); setEditNameVal(evidenceFiles[0].name); }}
              className="p-1 text-violet-500 hover:text-violet-700 hover:bg-violet-100 rounded cursor-pointer shrink-0" title="Edit nama dokumen"><Edit2 className="w-3.5 h-3.5" /></button>
          )}
        </div>
        <p className="text-[9px] text-violet-600/50 truncate">{evidenceFiles[0].link}</p>
      </div>
    </div>

    <div className="flex items-center gap-1.5 flex-wrap">
      {toEmbedUrl(evidenceFiles[0].link) && (
        <button onClick={() => setShowPreviewModal(true)}
          className="flex items-center gap-1 text-[10px] font-extrabold bg-baby-blue/60 hover:bg-baby-blue text-dark-gray border border-baby-blue/50 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer">
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
      )}
      <a href={evidenceFiles[0].link} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-1 text-[10px] font-extrabold bg-white hover:bg-peach-accent/40 text-dark-gray border border-dark-gray/15 px-2.5 py-1.5 rounded-lg transition-all">
        <ExternalLink className="w-3.5 h-3.5" /> Buka
      </a>
      {evidenceFiles[0].link.includes('drive.google.com') && (
        <a href={getDirectDownloadUrl(evidenceFiles[0].link)} download
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
        <button onClick={onClear} className="text-[10px] font-bold text-rose-600 hover:text-rose-800 px-2.5 py-1.5 cursor-pointer">
          Hapus Dokumen
        </button>
      )}
    </div>
  </>
) : isAuditor && !isReadOnly ? (
  /* Upload area (existing code — keep as-is) */
  ...
) : (
  /* No evidence, read-only */
  <div className="flex items-center gap-2 bg-dark-gray/4 rounded-lg px-3 py-2 border border-dark-gray/8">
    <File className="w-4 h-4 text-dark-gray/30" />
    <span className="text-[10px] text-dark-gray/45 italic">Belum ada dokumen bukti</span>
  </div>
)}
```

Note: The single-file view reads from `evidenceFiles[0]` instead of `evidenceLink`/`evidenceName`. The upload area remains identical to existing code (just keep the current JSX).

- [ ] **Step 7: Update preview modal for folder view**

The existing preview modal (lines ≈284-316) reads `evidenceLink` directly. For folder view, it needs to use `previewFile` state. Update the condition:

```tsx
// Before:
{showPreviewModal && evidenceLink && ( ... )}

// After:
const previewUrl = previewFile?.link || (evidenceFiles?.[0]?.link);
{showPreviewModal && previewUrl && (
  <div className="fixed inset-0 z-50 flex flex-col bg-dark-gray/80 backdrop-blur-sm" ...>
    ...
    <div className="flex items-center justify-between px-4 py-3 bg-dark-gray text-white flex-shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/10">
          <FileIcon className={`w-3.5 h-3.5 ${(previewFile ? getFileIcon(previewFile.name, previewFile.link) : fileInfo).color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-white truncate">{previewFile?.name || evidenceFiles?.[0]?.name || 'Dokumen Bukti'}</p>
          <p className="text-[9px] text-white/50 font-semibold">Preview Dokumen</p>
        </div>
      </div>
      ...
    </div>
    <div className="flex-1 overflow-hidden relative bg-neutral-900">
      {toEmbedUrl(previewUrl) ? (
        <iframe src={toEmbedUrl(previewUrl)} className="w-full h-full border-0" allow="autoplay" title="Preview" loading="lazy" />
      ) : ( ... same fallback ... )}
    </div>
  </div>
)}
```

Also add close handler that clears `previewFile`:

```tsx
onClick={(e) => { if (e.target === e.currentTarget) { setShowPreviewModal(false); setPreviewFile(null); } }}

// And in close button:
onClick={() => { setShowPreviewModal(false); setPreviewFile(null); }}
```

- [ ] **Step 8: Add handleUploadFolder to workspace view**

In `AuditWorkspaceView.tsx` (≈ around the existing upload handlers):

```typescript
const handleFolderUpload = async (itemId: string, files: File[]) => {
  if (isUploadingRef.current) return;
  setIsUploading(true);
  try {
    const results = await uploadFolderFiles(files, {
      fiscalYear: audit.fiscalYear,
      opdName: audit.opdName,
      auditType: audit.auditType,
      uploadedBy: currentUserName || audit.auditorName || 'Auditor'
    }, (done, total) => {
      showToast(`Mengunggah ${done} dari ${total}...`, 'info');
    });
    const item = audit.categories.flatMap(c => c.items).find(i => i.id === itemId);
    if (item) {
      const existing = item.evidenceFiles || [];
      handleFindingDetailsUpdate(itemId, {
        evidenceFiles: [...existing, ...results],
        evidenceHistory: [
          ...(item.evidenceHistory || []),
          ...results.map(r => ({
            name: r.name,
            link: r.link,
            uploadedAt: r.uploadedAt,
            uploadedBy: r.uploadedBy,
            action: 'diunggah' as const
          }))
        ]
      });
    }
  } catch (err: any) {
    showToast(`Upload folder gagal: ${err.message}`, 'error');
  } finally {
    setIsUploading(false);
  }
};
```

Pass to EvidencePanel:

```tsx
onUploadFolder={async (files) => handleFolderUpload(item.id, files)}
```

- [ ] **Step 9: Verify TypeScript**

Run: `npm run lint`

- [ ] **Step 10: Commit**

```bash
git add src/components/EvidencePanel.tsx src/components/AuditWorkspaceView.tsx
git commit -m "feat: folder viewer UI and auto-detect folder upload in EvidencePanel"
```

---

### Task 5: Progress & Stats Consistency

**Files:**
- Modify: `src/App.tsx` — `calculateProgress`
- Modify: `src/components/UserProfileView.tsx` — evidence count

- [ ] **Step 1: Update calculateProgress in App.tsx**

Line 728-741, change:

```typescript
const calculateProgress = (audit: OpdAudit): number => {
  if (audit.status === 'Selesai') return 100;
  let totalItems = 0;
  let uploadedItems = 0;
  audit.categories.forEach(cat => {
    cat.items.forEach(item => {
      totalItems++;
      if (item.evidenceFiles && item.evidenceFiles.length > 0) uploadedItems++;
    });
  });
  if (totalItems === 0) return 0;
  return Math.round((uploadedItems / totalItems) * 100);
};
```

- [ ] **Step 2: Update UserProfileView.tsx**

Find line ≈ 68, change:

```typescript
if (item.evidenceFiles && item.evidenceFiles.length > 0) uploaded++;
```

- [ ] **Step 3: Verify TypeScript**

Run: `npm run lint`

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/components/UserProfileView.tsx
git commit -m "fix: update progress calc to use evidenceFiles array"
```

---

### Task 6: Clean Up Legacy Props

**Files:**
- Modify: `src/components/AuditWorkspaceView.tsx`

- [ ] **Step 1: Remove evidenceLink/evidenceName from EvidencePanel usage (if no longer referenced elsewhere)**

In the `<EvidencePanel` usage (≈ line 609), remove `evidenceLink={item.evidenceLink} evidenceName={item.evidenceName}` and replace with `evidenceFiles={item.evidenceFiles}`.

Update `onChangeLink` and `onChangeName` to target `evidenceFiles[0]`:

```typescript
onChangeLink={(link) => handleFindingDetailChange(item.id, 'evidenceLink', link)}
// Keep for backward compat on the item level, but EvidencePanel no longer reads it
```

- [ ] **Step 2: Verify TypeScript**

Run: `npm run lint`

- [ ] **Step 3: Commit**

```bash
git add src/components/AuditWorkspaceView.tsx
git commit -m "refactor: EvidencePanel uses evidenceFiles instead of legacy link/name props"
```
