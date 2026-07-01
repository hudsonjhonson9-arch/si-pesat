# SI-PESAT — Sistem Informasi Penatausahaan Kertas Kerja Audit Terintegrasi

<div align="center">

![SI-PESAT](https://img.shields.io/badge/SI--PESAT-Audit%20Management-peachpuff?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss)

**Sistem pengelolaan Kertas Kerja Audit (KKA) berbasis web untuk Inspektorat Pembantu Wilayah IV, Kabupaten Sumba Barat.**

[Demo](#) · [Laporan Bug](https://github.com/hudsonjhonson9-arch/si-pesat/issues) · [Kontribusi](#kontribusi)

</div>

---

## 📋 Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Instalasi & Setup](#instalasi--setup)
- [Konfigurasi Supabase](#konfigurasi-supabase)
- [Peran & Hak Akses](#peran--hak-akses)
- [Alur Kerja Audit](#alur-kerja-audit)
- [Deployment](#deployment)
- [Skema Database](#skema-database)

---

## 📌 Tentang Proyek

SI-PESAT adalah aplikasi web manajemen audit yang dirancang khusus untuk **Inspektorat Kabupaten Sumba Barat**, memfasilitasi seluruh siklus audit mulai dari perencanaan, pelaksanaan KKA lapangan, review pimpinan, hingga pemantauan tindak lanjut.

Sistem ini menggantikan proses manual berbasis kertas/Excel dengan platform digital yang memungkinkan kolaborasi tim auditor secara real-time, sinkronisasi data ke cloud, dan pengelolaan dokumen bukti audit yang terstruktur.

---

## ✨ Fitur Utama

### 🗂️ Manajemen KKA (Kertas Kerja Audit)
- Inisiasi audit baru dengan pemilihan template jenis audit
- Multi-kategori audit dalam satu berkas KKA
- Checklist dokumen bukti pertanggungjawaban per item
- **Tambah/hapus item langsung di workspace** (tanpa mengubah template)
- **Drag-reorder item** dengan grip handle
- Klasifikasi temuan keuangan (overpayment, belanja fiktif, dll.)
- Riwayat perubahan dokumen bukti (audit trail)

### 👥 Manajemen Tim
- Penetapan Ketua Tim dan Anggota Tim per jenis audit
- Kontrol akses berbasis keanggotaan tim
- Penugasan dapat diubah oleh pimpinan

### 🔄 Alur Review Berjenjang
- Auditor mengajukan KKA untuk direview
- Inspektur Pembantu / Inspektur mereview dan memberi catatan
- Persetujuan atau pengembalian revisi
- Notifikasi real-time di Beranda

### 📅 Jadwal & Milestone
- 4 tahap standar: Perencanaan → Pelaksanaan → Penyusunan LHO/LHP → Pemantauan Tindak Lanjut
- Atur tanggal mulai, selesai, dan realisasi per tahap
- Notifikasi milestone yang melewati tenggat (overdue)
- Stepper visual progress timeline

### 📊 Statistik & Analitik
- Total KKA, KKA Final, KKA dalam proses
- Ringkasan temuan keuangan per audit
- Peta wilayah objek audit (Google Maps embed)
- Daftar objek audit dengan status pemeriksaan

### 🧑‍💼 Manajemen Pengguna (Admin/Inspektur)
- Daftar lengkap pengguna dengan role, NIP, golongan, pangkat
- Tambah pengguna baru (signup tanpa logout sesi admin)
- Toggle MFA (Autentikator Dua Langkah)
- Toggle status Administrator sistem
- Filter & pencarian pengguna

### 📄 Generator Dokumen
- **Sampul KKP** — Cover document otomatis
- **Surat Tugas** — Generator surat tugas audit
- **Nota Dinas** — Nota dinas internal
- **SPPD** — Surat Perintah Perjalanan Dinas

### ☁️ Sinkronisasi Cloud
- Auto-sync ke Supabase PostgreSQL (debounce 5 detik)
- Realtime subscription untuk kolaborasi multi-user
- Conflict detection saat data diubah bersamaan
- Offline support dengan localStorage fallback

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React 19 + TypeScript 5.8 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Animasi | Motion (Framer Motion) |
| Ikon | Lucide React |
| Backend/DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email/Password) |
| PDF/Dokumen | html2pdf.js |
| Maps | Leaflet + React Leaflet |
| File Upload | Google Drive API |
| Charts | Recharts |
| Deployment | Vercel |

---

## 📁 Struktur Proyek

```
si-pesat/
├── src/
│   ├── App.tsx                    # Root app, routing hash-based, state, auth, layout
│   ├── main.tsx                   # Entry point
│   ├── types.ts                   # TypeScript interfaces & types
│   ├── data.ts                    # Default template KKA
│   ├── index.css                  # Global styles & Tailwind directives
│   ├── components/
│   │   ├── HomeView.tsx           # Dashboard beranda
│   │   ├── AuditListView.tsx      # Daftar KKA, filter, sorting, hapus
│   │   ├── AuditWorkspaceView.tsx # Workspace KKA (checklist, evidence, docs, schedule)
│   │   ├── NewAuditView.tsx       # Wizard inisiasi audit baru + jadwal
│   │   ├── StatistikView.tsx      # Charts & statistik
│   │   ├── UserManagementView.tsx # CRUD pengguna (admin)
│   │   ├── UserProfileView.tsx    # Profil + tugas pengguna
│   │   ├── TemplateConfiguratorView.tsx # CRUD template jenis audit
│   │   ├── LoginView.tsx          # Halaman login
│   │   ├── EvidencePanel.tsx      # Upload/tautan dokumen bukti
│   │   ├── CoverDocumentGenerator.tsx   # Generator sampul KKP
│   │   ├── SuratTugasGenerator.tsx      # Generator surat tugas
│   │   ├── NotaDinasGenerator.tsx       # Generator nota dinas
│   │   ├── SPPDGenerator.tsx            # Generator SPPD
│   │   ├── ReviuView.tsx          # Antrian review (status Direview)
│   │   ├── EvaluasiView.tsx       # Evaluasi pasca-audit
│   │   ├── AsistensiView.tsx      # Asistensi teknis (Draft)
│   │   ├── GuideView.tsx          # Panduan pengguna
│   │   ├── ActivityLogView.tsx    # Log aktivitas sistem
│   │   ├── NotificationBell.tsx   # Notifikasi real-time
│   │   ├── WilayahPenugasanView.tsx # Peta objek audit
│   │   ├── RolePermissionView.tsx   # Matriks role-permission
│   │   └── SearchableSelect.tsx     # Dropdown dengan search
│   └── lib/
│       ├── supabase.ts            # Supabase client
│       ├── googleDrive.ts         # Google Drive upload helper
│       ├── permissions.ts         # RBAC PermissionChecker
│       ├── notifications.ts       # Notifikasi CRUD
│       ├── log.ts                 # Activity logging
│       └── escape.ts              # HTML escape utility
├── docs/
│   ├── user-guide.md             # Panduan pengguna lengkap
│   └── superpowers/specs/         # Spesifikasi fitur
├── public/
│   └── header-bg.jpg             # Background banner beranda
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 Instalasi & Setup

### Prasyarat
- **Node.js** v18+
- **npm** v9+
- Akun **Supabase** (gratis)
- Akun **Vercel** (untuk deploy)

### 1. Clone Repository

```bash
git clone https://github.com/hudsonjhonson9-arch/si-pesat.git
cd si-pesat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

Buat file `.env.local` di root proyek:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Cara mendapatkan keys:** Buka Supabase Dashboard → Project Settings → API

### 4. Setup Database

Jalankan isi file `supabase_schema.sql` di **Supabase SQL Editor**:

1. Buka [app.supabase.com](https://app.supabase.com)
2. Pilih project → **SQL Editor**
3. Paste seluruh konten `supabase_schema.sql`
4. Klik **Run**

### 5. Jalankan Lokal

```bash
npm run dev
```

Aplikasi berjalan di: **http://localhost:3000**

---

## 🗄️ Konfigurasi Supabase

### Tabel yang Diperlukan

| Tabel | Deskripsi |
|-------|-----------|
| `profiles` | Data pengguna (role, NIP, golongan, is_admin) |
| `audits` | Data KKA dengan categories (JSONB) |
| `templates` | Template jenis audit |
| `target_entities` | Daftar objek audit (OPD, sekolah, desa, dll.) |

### Kolom Tambahan profiles

Jalankan jika upgrade dari versi lama:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nip TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS golongan TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pangkat TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mfa_required BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
```

### Set Admin

```sql
UPDATE profiles SET is_admin = true WHERE email = 'email-admin@domain.com';
```

### Realtime

Aktifkan Realtime pada tabel `audits` di Supabase Dashboard:
**Database → Replication → Supabase Realtime → Centang `audits`**

---

## 👤 Peran & Hak Akses

### Hierarki Jabatan

```
Inspektur
  └── Inspektur Pembantu (Irban)
        └── Auditor Ahli Utama / Madya / Muda
              └── Auditor Ahli Pertama
                    └── Auditor Penyelia / Pelaksana Lanjutan / Pelaksana
        └── PPUPD Ahli Utama / Madya / Muda / Pertama
```

### Matriks Hak Akses

| Aksi | Auditor Fungsional | Inspektur Pembantu | Inspektur | Admin |
|------|:-----------------:|:-----------------:|:---------:|:-----:|
| Lihat KKA | ✅ (tim sendiri) | ✅ | ✅ | ✅ |
| Edit KKA | ✅ (Draft/Berjalan) | ✅ | ✅ | ✅ |
| Upload Bukti | ✅ | ✅ | ✅ | ✅ |
| Ajukan Review | ✅ (Ketua Tim) | — | — | — |
| Setujui/Tolak Review | — | ✅ | ✅ | ✅ |
| Tambah Kategori KKA | — | ✅ | ✅ | ✅ |
| Edit Profil OPD | — | ✅ | ✅ | ✅ |
| Manajemen Pengguna | — | ✅ | ✅ | ✅ |
| Ubah Role Pengguna | — | — | ✅ | ✅ |
| Toggle MFA | — | — | ✅ | ✅ |
| Hapus KKA | — | ✅ | ✅ | ✅ |

### Ketua Tim vs Anggota Tim

- **Ketua Tim** (minimal Auditor Ahli Muda / PPUPD Ahli Muda): Dapat mengajukan KKA untuk direview, mengelola anggota tim
- **Anggota Tim**: Dapat mengisi dan upload dokumen bukti
- Auditor yang **tidak terdaftar** di tim manapun: hanya baca (read-only)

---

## 🔄 Alur Kerja Audit

```
1. INISIASI
   └── Admin/Irban buat KKA baru
   └── Pilih template, OPD, tahun anggaran, tim
   └── Atur jadwal milestone

2. PELAKSANAAN (Status: Draft → Sedang Berjalan)
   └── Auditor isi checklist dokumen bukti
   └── Upload bukti ke Google Drive / tautan
   └── Input temuan keuangan (nilai, klasifikasi, uraian, rekomendasi)
   └── Update progress jadwal milestone

3. PENGAJUAN REVIEW
   └── Ketua Tim klik "Ajukan Review"
   └── Status kategori → "Direview"
   └── Notifikasi muncul di Beranda Irban/Inspektur

4. REVIEW PIMPINAN (Status: Direview)
   └── Irban/Inspektur buka KKA
   └── Isi "Catatan Review" per item
   └── Pilih: Setujui → Status "Selesai" | Kembalikan Revisi → Status "Sedang Berjalan"

5. SELESAI
   └── Semua kategori "Selesai" → KKA final
   └── KKA terkunci dari editing
```

---

## 📱 Navigasi Mobile

Bottom navigation bar dengan 5 item tetap (tidak berubah walau admin):

| Posisi | Item | Keterangan |
|--------|------|-----------|
| 1 | Beranda | Dashboard & statistik |
| 2 | Audit | Daftar KKA |
| 3 | **Buat KKA** | CTA utama (menonjol, rounded) |
| 4 | Profil | Profil pengguna |
| 5 | Lainnya | Sheet pop-up: Statistik, Jenis Audit, Pengguna |

---

## 🚢 Deployment

### Deploy ke Vercel

1. Push ke GitHub repository
2. Buka [vercel.com](https://vercel.com) → **New Project**
3. Import repository `si-pesat`
4. Tambahkan **Environment Variables**:
   ```
   VITE_SUPABASE_URL = https://...
   VITE_SUPABASE_ANON_KEY = eyJ...
   ```
5. Deploy — Vercel auto-deploy setiap push ke `main`

### Build Manual

```bash
npm run build
# Output tersedia di folder /dist
```

---

## 🗃️ Skema Database

### `profiles`
```sql
id          UUID (FK auth.users)
email       TEXT
full_name   TEXT
role        TEXT  -- Lihat ROLE_OPTIONS
nip         TEXT
golongan    TEXT  -- e.g. "III/a"
pangkat     TEXT  -- e.g. "Penata Muda"
is_admin    BOOLEAN
mfa_required BOOLEAN
```

### `audits`
```sql
id           UUID
opd_name     TEXT
opd_type     TEXT
fiscal_year  TEXT
auditor_name TEXT
audit_date   DATE
status       TEXT  -- Draft | Sedang Berjalan | Direview | Selesai
progress     NUMERIC
categories   JSONB -- Array AuditCategory[]
team_members JSONB -- Array string[]
schedule     JSONB -- Array AuditMilestone[]
updated_at   TIMESTAMP
```

### `templates`
```sql
id          TEXT
name        TEXT
is_default  BOOLEAN
categories  JSONB  -- Array TemplateCategory[]
updated_at  TIMESTAMP
```

### `target_entities`
```sql
id        UUID
name      TEXT
type      TEXT  -- OPD | Desa | Sekolah | Puskesmas | Lainnya
head_name TEXT
contact   TEXT
address   TEXT
```

---

## 🔐 Keamanan

- **Row Level Security (RLS)**: Saat ini dinonaktifkan untuk kemudahan development. Aktifkan saat production dengan kebijakan yang sesuai.
- **Autentikasi**: Supabase Auth dengan email/password
- **MFA**: Support TOTP (Google/Microsoft Authenticator) per pengguna, dikontrol admin
- **Secondary Client**: Signup pengguna baru menggunakan instance Supabase terpisah agar sesi admin tidak terputus
- **Conflict Detection**: Pengecekan konflik data real-time sebelum menyimpan perubahan kritis

---

## 🧑‍💻 Scripts

```bash
npm run dev      # Development server (localhost:3000)
npm run build    # Production build (output: /dist)
npm run preview  # Preview hasil build
npm run lint     # TypeScript type checking (tsc --noEmit)
npm run clean    # Hapus folder dist
```

---

## 📝 Kontribusi

Proyek ini dikelola oleh tim internal Inspektorat Kabupaten Sumba Barat. Untuk pertanyaan teknis atau permintaan fitur, hubungi pengembang melalui:

- GitHub Issues: [hudsonjhonson9-arch/si-pesat/issues](https://github.com/hudsonjhonson9-arch/si-pesat/issues)

---

## 📄 Lisensi

```
Apache License 2.0
Copyright (c) 2025 Inspektorat Kabupaten Sumba Barat
```

---

<div align="center">
  <sub>Dibangun dengan ❤️ untuk Inspektorat Kabupaten Sumba Barat</sub>
</div>
