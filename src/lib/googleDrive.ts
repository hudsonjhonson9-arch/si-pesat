import { supabase } from './supabase';
import { EvidenceFile } from '../types';

/**
 * Dapatkan session token untuk autentikasi ke Google Apps Script
 */
async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sesi tidak ditemukan. Silakan login ulang.');
  }
  return session.access_token;
}

export async function uploadEvidenceFile(
  file: File,
  year?: string,
  opdName?: string,
  auditType?: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const baseUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  if (!baseUrl) {
    throw new Error("VITE_GOOGLE_SCRIPT_URL belum diatur di environment variable.");
  }

  const token = await getAuthToken();
  const url = baseUrl + '?token=' + encodeURIComponent(token);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileContent = reader.result as string;
        const base64Data = fileContent.split(',')[1];

        const payload = {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64: base64Data,
          year: year,
          opd: opdName,
          auditType: auditType
        };

        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });

        if (response.status === 401) {
          throw new Error('Sesi telah kedaluwarsa. Silakan login ulang.');
        }

        if (!response.ok) {
          throw new Error(`Upload gagal dengan status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Unknown upload error');
        }

        resolve({
          id: result.data.id,
          name: result.data.name,
          webViewLink: result.data.webViewLink
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function copyEvidenceFileFromUrl(
  sourceUrl: string,
  fileName: string,
  year?: string,
  opdName?: string,
  auditType?: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const baseUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  if (!baseUrl) {
    throw new Error("VITE_GOOGLE_SCRIPT_URL belum diatur di environment variable.");
  }

  const token = await getAuthToken();
  const url = baseUrl + '?token=' + encodeURIComponent(token);

  let sourceId = '';
  const matchD = sourceUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  const matchId = sourceUrl.match(/id=([a-zA-Z0-9_-]+)/);
  if (matchD && matchD[1]) {
    sourceId = matchD[1];
  } else if (matchId && matchId[1]) {
    sourceId = matchId[1];
  } else {
    throw new Error("URL Google Drive tidak valid. Gagal menemukan ID Dokumen.");
  }

  const payload = {
    action: 'copy',
    sourceId: sourceId,
    name: fileName,
    year: year,
    opd: opdName,
    auditType: auditType
  };

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }
  });

  if (response.status === 401) {
    throw new Error('Sesi telah kedaluwarsa. Silakan login ulang.');
  }

  if (!response.ok) {
    throw new Error(`Copy gagal dengan status: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Unknown copy error. Pastikan link dapat diakses (Anyone with link can view).');
  }

  return {
    id: result.data.id,
    name: result.data.name,
    webViewLink: result.data.webViewLink
  };
}

export async function uploadFolderFiles(
  files: File[],
  auditInfo: { fiscalYear?: string; opdName?: string; auditType?: string; uploadedBy: string },
  onProgress?: (completed: number, total: number, file?: EvidenceFile) => void
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
      const ef: EvidenceFile = {
        id: result.data.id,
        name: result.data.name,
        link: result.data.webViewLink,
        relativePath: relativePath,
        uploadedAt: new Date().toISOString(),
        uploadedBy: auditInfo.uploadedBy,
        size: file.size
      };
      resolve(ef);
    } catch (err) { reject(err); }
  };
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
    });
  };

  // Upload with concurrency limit — skip failed files instead of throwing
  const queue = [...files];
  const errors: string[] = [];
  async function worker() {
    while (queue.length > 0) {
      const file = queue.shift()!;
      try {
        const result = await uploadOne(file);
        results.push(result);
      } catch (e) {
        errors.push(`${file.name}: ${(e as Error).message || e}`);
      }
      completed++;
      onProgress?.(completed, files.length);
    }
  }
  const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker());
  await Promise.all(workers);
  if (errors.length > 0) throw new Error(`${errors.length} file gagal: ${errors.join('; ')}`);
  return results;
}
