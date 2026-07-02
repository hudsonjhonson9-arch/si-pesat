### Task 3: Upload Engine — Folder Upload Helper

**Files:**
- Modify: `src/lib/googleDrive.ts`

**Interfaces:**
- Produces: `uploadFolderFiles(files: File[], auditInfo, onProgress?): Promise<EvidenceFile[]>`

**Context:** The `EvidenceFile` type was defined in Task 1. The backend `subPath` was added in Task 2. This task creates the client-side upload engine that reads files from a folder upload (via `webkitRelativePath`), uploads them in parallel (concurrency 3) to GAS, preserving folder structure via `subPath`, and returns `EvidenceFile[]`.

**Steps:**

Add the following function to `src/lib/googleDrive.ts`:

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

1. Add `EvidenceFile` import at the top (the function returns `EvidenceFile[]`):
```typescript
import { EvidenceFile } from '../types';
```

2. Run `npm run lint` to verify

3. Commit: `git add src/lib/googleDrive.ts && git commit -m "feat: add uploadFolderFiles with concurrency for folder upload"`
