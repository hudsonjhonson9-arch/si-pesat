### Task 4: EvidencePanel — Folder Viewer & Auto-Detect Upload

**Files:**
- Rewrite: `src/components/EvidencePanel.tsx`
- Modify: `src/components/AuditWorkspaceView.tsx`

**Interfaces:**
- Consumes: `EvidenceFile[]` from props (from Task 1)
- Consumes: `onUploadFolder(files: File[])` callback
- Produces: folder viewer UI, auto-detect file vs folder upload, workspace integration

---

## Part A: EvidencePanel.tsx Changes

### Props Update

Replace the EvidencePanelProps interface — change `evidenceLink?` and `evidenceName?` to `evidenceFiles?: EvidenceFile[]`, add `onUploadFolder`, remove `onChangeLink`/`onChangeName`:

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

Add import: `import { EvidenceFile } from '../types';`

### New State

Add after existing state:
```typescript
const [previewFile, setPreviewFile] = useState<EvidenceFile | null>(null);
const [showFolderPicker, setShowFolderPicker] = useState(false);
const [isDragFolder, setIsDragFolder] = useState(false);
const folderInputRef = useRef<HTMLInputElement>(null);
```

### Folder Detection in Drag & Drop

Replace existing `handleDrop`:

```typescript
const handleDrop = useCallback((e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(false);
  setIsDragFolder(false);
  const items = e.dataTransfer.items;
  if (items.length > 0) {
    const entry = items[0].webkitGetAsEntry?.();
    if (entry?.isDirectory) {
      const files = Array.from(e.dataTransfer.files).filter(f => f.size > 0);
      if (files.length > 0) onUploadFolder(files);
      return;
    }
  }
  const file = e.dataTransfer.files[0];
  if (file) initiateUpload(file);
}, [onUploadFolder]);
```

Replace existing `onDragOver` inline handler — call a function:

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

### Click Upload with Folder Picker

Add handler:
```typescript
const handleClickUpload = () => {
  if (isUploading) return;
  setShowFolderPicker(true);
};
```

Change upload area `onClick` from `fileInputRef.current?.click()` to `handleClickUpload`.

Add hidden folder input next to existing file input:
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
        <button onClick={() => { setShowFolderPicker(false); fileInputRef.current?.click(); }}
          className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:bg-peach-accent/10 font-bold text-xs flex items-center gap-3 cursor-pointer">
          <Upload className="w-4 h-4" /> Unggah File
        </button>
        <button onClick={() => { setShowFolderPicker(false); folderInputRef.current?.click(); }}
          className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:bg-peach-accent/10 font-bold text-xs flex items-center gap-3 cursor-pointer">
          <Upload className="w-4 h-4" /> Unggah Folder
        </button>
        <button onClick={() => setShowFolderPicker(false)} className="w-full text-center py-2 text-[10px] font-bold text-slate-500 cursor-pointer">Batal</button>
      </div>
    </div>
  </div>
)}
```

### Update Drag-Over Text

In upload area, change drag-over text to show folder-specific message — replace current static text with conditional based on `isDragFolder`.

### Three-State Evidence Render

Replace the existing `{hasEvidence ? ...}` block with a 3-state render based on `evidenceFiles?.length`:

**State >1 (Folder Viewer):**
```tsx
{evidenceFiles && evidenceFiles.length > 1 && (
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
)}
```

**State === 1 (Single file view — adapted from existing code, using `evidenceFiles[0]` instead of `evidenceLink`/`evidenceName`):**
Keep existing single-file UI but read `evidenceFiles[0].name` and `evidenceFiles[0].link` instead of `evidenceName`/`evidenceLink`.

**State === 0 or undefined (upload area):**
Keep existing upload area code (the two-tab upload/link UI).

### Update Preview Modal

Change the preview modal to use `previewFile` when set, fall back to `evidenceFiles[0]`:

```typescript
const previewUrl = previewFile?.link || (evidenceFiles?.[0]?.link);
```

Replace `{showPreviewModal && evidenceLink && (` with `{(showPreviewModal || previewFile) && previewUrl && (`.

Update close handler to also clear `previewFile`:
```typescript
onClick={(e) => { if (e.target === e.currentTarget) { setShowPreviewModal(false); setPreviewFile(null); } }}
```

---

## Part B: AuditWorkspaceView.tsx Changes

### Add `handleFolderUpload`

After existing `handleDirectUpload`/`handleDirectCopy` handlers (around line 320), add:

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

Add import: `import { uploadFolderFiles } from '../lib/googleDrive';`

### Update EvidencePanel Usage

In the `<EvidencePanel` usage:
- Replace `evidenceLink={item.evidenceLink} evidenceName={item.evidenceName}` with `evidenceFiles={item.evidenceFiles}`
- Add `onUploadFolder={async (files) => handleFolderUpload(item.id, files)}`

---

**Verify:** `npm run lint`

**Commit:** `git add src/components/EvidencePanel.tsx src/components/AuditWorkspaceView.tsx && git commit -m "feat: folder viewer UI and auto-detect folder upload in EvidencePanel"`
