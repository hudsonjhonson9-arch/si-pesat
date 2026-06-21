<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# SI-PESAT

Sistem pengelolaan Kertas Kerja Audit (KKA) berbasis web untuk Inspektorat Kabupaten Sumba Barat — multi-bidang (Irban I—V).

## Fitur

- Manajemen KKA (CRUD) dengan workflow approval
- Categori / sub-category KKA per OPD
- Template KKA yang dapat dikonfigurasi
- Upload evidence pendukung
- Dashboard statistik pengawasan
- Generate dokumen (Nota Dinas, SPPD, Surat Tugas, Cover)
- RBAC (Role-Based Access Control) dengan scope bidang
- Multi-bidang (Irban I—V) dengan data terisolasi per bidang

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **CSS:** Tailwind CSS + shadcn/ui
- **Dokumen:** Google Apps Script + Google Drive API

## Database Schema

### `profiles`
```sql
id         UUID PRIMARY KEY   (FK auth.users)
email      TEXT NOT NULL
full_name  TEXT
role       TEXT               -- 'Auditor Pelaksana', 'Inspektur', ...
is_admin   BOOLEAN DEFAULT false
bidang_id  INT   (FK bidang)  -- Irban tempat user bertugas
```

### `audits`
```sql
id           UUID PRIMARY KEY
opd_name     TEXT NOT NULL
opd_type     TEXT NOT NULL
fiscal_year  TEXT NOT NULL
auditor_name TEXT NOT NULL
audit_date   DATE NOT NULL
status       TEXT NOT NULL     -- draft, review, approved, finalized
progress     NUMERIC DEFAULT 0
categories   JSONB
team_members JSONB
schedule     JSONB
created_by   UUID (FK profiles)
bidang_id    INT  (FK bidang)
```

### `templates`
```sql
id          TEXT PRIMARY KEY
name        TEXT NOT NULL
is_default  BOOLEAN DEFAULT false
categories  JSONB
bidang_id   INT  (FK bidang)
```

### `target_entities`
```sql
id         UUID PRIMARY KEY
name       TEXT NOT NULL
type       TEXT    -- OPD, Desa, Sekolah, Puskesmas, Lainnya
head_name  TEXT
contact    TEXT
address    TEXT
bidang_id  INT (FK bidang)
```

### `bidang`
```sql
id      INT PRIMARY KEY
name    TEXT          -- Irban I, Irban II, ...
wilayah TEXT          -- Wilayah binaan (opsional)
```

### `roles`
```sql
id   INT PRIMARY KEY
name TEXT UNIQUE     -- Auditor Pelaksana, Sekretaris, ...
```

### `permissions`
```sql
id   INT PRIMARY KEY
code TEXT UNIQUE     -- audit.view, user.manage, ...
label TEXT           -- Lihat Audit, Kelola User, ...
```

### `role_permissions`
```sql
role_id       INT    (FK roles)
permission_id INT    (FK permissions)
scope         TEXT   -- 'bidang' | 'all'
```

## 👤 Peran & Hak Akses

### Daftar Role (15 role)

| Role | Level |
|------|-------|
| Inspektur | Tertinggi |
| Sekretaris | Tertinggi |
| Inspektur Pembantu (Irban) | Tinggi |
| Auditor Ahli Utama | Fungsional |
| Auditor Ahli Madya | Fungsional |
| Auditor Ahli Muda | Fungsional |
| Auditor Ahli Pertama | Fungsional |
| Auditor Penyelia | Fungsional |
| Auditor Pelaksana Lanjutan | Fungsional |
| Auditor Pelaksana | Fungsional |
| PPUPD Ahli Utama | Fungsional |
| PPUPD Ahli Madya | Fungsional |
| PPUPD Ahli Muda | Fungsional |
| PPUPD Ahli Pertama | Fungsional |
| PPPK | Fungsional (terbatas) |

### Hak Akses

Hak akses dikonfigurasi secara dinamis via menu **Role & Permission** oleh Inspektur/Sekretaris. Setiap role memiliki izin (permission) dengan scope:
- **Bidang** — hanya dalam Irban sendiri
- **Semua** — lintas Irban (Inspektur, Sekretaris)

## Project Structure

```
si-pesat/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── supabase_schema.sql       # Full DDL untuk Supabase
├── google-apps-script.gs      # Apps Script untuk generate dokumen
├── insert_entities.ts         # Seeder target entities
├── assets/
├── public/
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types.ts
    ├── data.ts
    ├── index.css
    ├── lib/
    │   ├── supabase.ts            # Supabase client
    │   ├── permissions.ts         # Permission checker (RBAC)
    │   └── googleDrive.ts         # Google Drive upload helper
    └── components/
        ├── LoginView.tsx
        ├── HomeView.tsx
        ├── AuditListView.tsx
        ├── AuditWorkspaceView.tsx
        ├── NewAuditView.tsx
        ├── EvidencePanel.tsx
        ├── StatistikView.tsx
        ├── UserManagementView.tsx
        ├── UserProfileView.tsx
        ├── RolePermissionView.tsx  # Role & permission admin UI
        ├── TemplateConfiguratorView.tsx
        ├── CoverDocumentGenerator.tsx
        ├── NotaDinasGenerator.tsx
        ├── SPPDGenerator.tsx
        ├── SuratTugasGenerator.tsx
        └── SearchableSelect.tsx
```

## Setup Supabase

1. Buat project di [supabase.com](https://supabase.com)
2. Buka **SQL Editor**, paste dan jalankan isi [`supabase_schema.sql`](./supabase_schema.sql)
3. Di **Authentication > Settings**, aktifkan **Email + Password** sign-up
4. **Auto-confirm emails** diaktifkan (atap konfirmasi manual sesuai kebutuhan)
5. Set `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di `.env.local`

### Multi-Bidang Migration (v2.0+)

Untuk upgrade dari versi single-Irban ke multi-bidang, jalankan migration berikut di SQL Editor:

```bash
# Jalankan isi file:
supabase/migrations/20260621_multi_bidang_rbac.sql
```

## Run Locally

```bash
npm install
npm run dev
```

Pastikan `.env.local` sudah diisi dengan credentials Supabase.
