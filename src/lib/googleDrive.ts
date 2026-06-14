/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpdAudit } from '../types';

/**
 * Upload an evidence document (pdf, excel, docx, etc.) to the Centralized Google Drive
 * via Google Apps Script Web App.
 */
export async function uploadEvidenceFile(
  file: File,
  year?: string,
  opdName?: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

  if (!SCRIPT_URL) {
    throw new Error("VITE_GOOGLE_SCRIPT_URL belum diatur di environment variable.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileContent = reader.result as string;
        // The reader.result is a data URL: "data:application/pdf;base64,JVBERi0xLjc..."
        const base64Data = fileContent.split(',')[1];
        
        const payload = {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64: base64Data,
          year: year,
          opd: opdName
        };

        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          }
        });

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`);
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
    reader.readAsDataURL(file); // Read as Data URL to get base64 easily
  });
}

/**
 * Copy a file from a Google Drive URL to the Centralized Google Drive
 * via Google Apps Script Web App.
 */
export async function copyEvidenceFileFromUrl(
  sourceUrl: string,
  fileName: string,
  year?: string,
  opdName?: string
): Promise<{ id: string; name: string; webViewLink: string }> {
  const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL;

  if (!SCRIPT_URL) {
    throw new Error("VITE_GOOGLE_SCRIPT_URL belum diatur di environment variable.");
  }

  // Extract File ID from Google Drive URL
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
    opd: opdName
  };

  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    }
  });

  if (!response.ok) {
    throw new Error(`Copy failed with status: ${response.status}`);
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
