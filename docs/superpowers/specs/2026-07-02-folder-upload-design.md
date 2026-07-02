# Folder Upload — Evidence Panel SI-PESAT

## Ringkasan

Mengganti upload single file di EvidencePanel menjadi upload folder via browser
dengan deteksi otomatis (drag folder/file atau klik pilih), penyimpanan struktur
folder ke Google Drive, dan folder viewer untuk multi-file.

## Data Model

### Type Baru

```typescript
export interface EvidenceFile {
  id: string;
  name: string;
  link: string;          // Google Drive URL
  relativePath: string;  // e.g. "laporan/foto/kegiatan1.jpg"
  uploadedAt: string;
  uploadedBy: string;
  size: number;          // bytes
}
```

### AuditItem — perubahan

```typescript
interface AuditItem {
  // existing fields tetap...
  evidenceLink?: string;      // backup backward compat, tidak dipakai
  evidenceName?: string;      // backup backward compat, tidak dipakai
  evidenceFiles?: EvidenceFile[]; // source of truth baru
}
```

### Auto-migrasi

Saat load audits dari localStorage (useEffect mount) atau fetch dari Supabase,
jika `evidenceLink` ada tapi `evidenceFiles` null/undefined, buat
`evidenceFiles` dengan 1 entry dari `evidenceLink` + `evidenceName`.
Size di-set 0 karena tidak tersedia dari data lama.

## UI EvidencePanel

### Layout Border — 3 state

| evidenceFiles.length | Tampilan |
|---------------------|----------|
| 0 | Upload area (sama seperti sekarang — drag/click) |
| 1 | Single file view (sama seperti sekarang — icon + nama + preview/download/copy/hapus) |
| >1 | Folder viewer (list file + relativePath + preview per file) |

### Upload Area

- Drag & drop: deteksi folder via `DataTransferItem.webkitGetAsEntry()`
  kalau folder → traversal recursive, kalau file → upload biasa.
- Click: modal kecil "Pilih File" / "Pilih Folder" — file pake input
  biasa (`accept`), folder pake input kedua (`webkitdirectory`).
- Tidak ada tombol terpisah di panel — cukup area upload yang sama.

### Folder Viewer (>1 file)

- Header: "N dokumen" + tombol tambah file/folder
- List:
  - Icon file (sama seperti sekarang)
  - Nama file
  - RelativePath (abu-abu kecil)
  - Tombol Preview (modal per-file, reuse existing)
  - Tombol Buka Drive
- Sortir alphabetical by relativePath
- Drag tambahan: bisa drop file individual ke folder viewer untuk nambah

### Single File View (=1 file)

- Persis seperti EvidencePanel saat ini (tidak berubah)

## Upload Engine

### googleDrive.ts — fungsi baru

`uploadFolderFiles(files: File[], auditInfo): Promise<EvidenceFile[]>`
- Iterasi `FileList` dari `webkitdirectory`
- Upload paralel, concurrency limit 3
- Tiap file kirim `subPath` dari `webkitRelativePath`
- Return array `EvidenceFile[]`

### googleAppsScript.gs — perubahan

Parameter baru `subPath` (opsional):
- Saat ada, split by `/`, tiap segmen jadi nested `getOrCreateFolder`
- Struktur final: `ROOT / TA {year} / {OPD} / {auditType} / {subPath parts...} / {file}`
- Tanpa `subPath`: struktur existing (tidak berubah, backward compat)

## Dampak ke Kode Lain

### App.tsx — calculateProgress
```typescript
// before
if (item.evidenceLink && item.evidenceLink.trim() !== '')
// after
if (item.evidenceFiles && item.evidenceFiles.length > 0)
```

### UserProfileView.tsx
Sama — update check evidence dari `evidenceLink` ke `evidenceFiles?.length > 0`

### AuditWorkspaceView.tsx
- `handleDirectUpload`: push file hasil upload ke `evidenceFiles[]`
- `handleDirectCopy`: push hasil copy ke `evidenceFiles[]`
- `onClear`: hapus `evidenceFiles`
- `onChangeLink`/`onChangeName`: update entry di `evidenceFiles[0]`

### data.ts
Tidak perlu perubahan (template item tidak pakai evidence)

## Supabase / Backend

Tidak ada perubahan schema — `categories` JSONB sudah nyimpen `AuditCategory[]`
dengan `AuditItem[]` di dalamnya. Field `evidenceFiles` otomatis tersimpan.

## Batasan

- Google Drive upload tetap per-file (Apps Script tidak support multi-file upload)
- File size limit tetap 15MB per file (dari GAS)
- Tidak ada progress bar per-file — cukup counter "X of Y files uploaded"
- Concurrency 3 paralel
