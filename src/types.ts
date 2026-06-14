/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AuditStatus = 'Draft' | 'Sedang Berjalan' | 'Direview' | 'Selesai';
export type AuditType = string;

export type FindingStatus = 'Sesuai' | 'Temuan' | 'N/A';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  nip?: string;
  golongan?: string;
  pangkat?: string;
}

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
  auditorName?: string;
  teamMembers?: string[];
  fiscalYear?: string;
  auditDate?: string;
}

export interface OpdAudit {
  id: string;
  opdName: string; // Nama Instansi / OPD / OPD
  opdType: 'SD' | 'SMP' | 'SMA' | 'SMK' | 'SLB' | 'Dinas' | 'Badan' | 'Kecamatan' | 'Desa' | 'Kelurahan' | 'Puskesmas' | 'Lainnya';
  auditType: AuditType;
  fiscalYear: string;
  auditorName: string;
  auditDate: string;
  status: AuditStatus;
  progress: number; // Persentase penyelesaian KKA
  categories: AuditCategory[];
  teamMembers?: string[]; // Daftar nama anggota tim
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

export interface TargetEntity {
  id: string;
  name: string;
  type: 'OPD' | 'Desa' | 'Sekolah' | 'Puskesmas' | 'Lainnya';
  head_name?: string;
  contact?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}
