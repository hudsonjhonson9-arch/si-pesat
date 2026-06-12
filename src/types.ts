/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AuditStatus = 'Draft' | 'Sedang Berjalan' | 'Direview' | 'Selesai';

export type FindingStatus = 'Sesuai' | 'Temuan' | 'N/A';

export interface AuditItem {
  id: string;
  title: string;
  description: string;
  status: FindingStatus;
  nilaiTemuan: number; // Nilai temuan keuangan dalam Rupiah
  jenisTemuan?: 'Kelebihan Pembayaran' | 'Belanja Fiktif' | 'Pemborosan' | 'Pajak Belum Disetor' | 'Tidak Sesuai Juknis' | 'Lainnya';
  uraianTemuan: string;
  rekomendasi: string;
  evidenceLink?: string; // Tautan dokumen Google Drive (pdf, excel, docx)
  evidenceName?: string; // Nama berkas bukti
  catatanReview?: string; // Catatan review dari Inspektur Pembantu / Inspektur
}

export interface AuditCategory {
  id: string;
  name: string;
  description: string;
  items: AuditItem[];
}

export interface OpdAudit {
  id: string;
  opdName: string; // Nama Instansi / OPD / OPD
  opdType: 'SD' | 'SMP' | 'SMA' | 'SMK' | 'SLB' | 'Dinas' | 'Badan' | 'Kecamatan' | 'Puskesmas' | 'Lainnya';
  fiscalYear: string;
  auditorName: string;
  auditDate: string;
  budget: number; // Total Anggaran (Dana BOS atau Anggaran OPD)
  status: AuditStatus;
  progress: number; // Persentase penyelesaian KKA
  categories: AuditCategory[];
  googleDriveFolderId?: string;
  googleDriveFileId?: string; // Cache of consolidated file ID
  lastSyncedAt?: string;
}

export interface TemplateItem {
  id: string;
  title: string;
  description: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  items: TemplateItem[];
}

export interface KKATemplate {
  id: string;
  name: string;
  isDefault: boolean;
  categories: TemplateCategory[];
}

export interface SyncLog {
  id: string;
  timestamp: string;
  type: 'UPLOAD' | 'DOWNLOAD' | 'CREATE_FOLDER' | 'ERROR';
  description: string;
  opdName?: string;
}
