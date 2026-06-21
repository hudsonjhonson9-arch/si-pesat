# Multi-Bidang & RBAC — Design Spec

## 1. Tujuan

Scale SI-PESAT dari single-wilayah (Irban IV, Kecamatan Loli) menjadi multi-bidang
(Irban I—V) dengan sistem role & permission yang dapat dikonfigurasi lewat UI admin.

## 2. Tabel Baru

### `bidang`
```sql
CREATE TABLE bidang (
  id      INT PRIMARY KEY,
  name    TEXT NOT NULL,       -- "Irban I", "Irban II", ...
  wilayah TEXT                 -- deskripsi wilayah binaan (opsional)
);
```

### `roles`
Menggantikan `profiles.role` string. Berisi 15 role default:
- 13 existing (Auditor Pelaksana s.d. Inspektur)
- Sekretaris
- PPPK (dan ASN lain)

```sql
CREATE TABLE roles (
  id   INT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
```

### `permissions`
Daftar izin granular yang bisa diatur per role:

| code | label |
|------|-------|
| `audit.view` | Lihat Audit |
| `audit.create` | Buat Audit |
| `audit.edit` | Edit Audit |
| `audit.delete` | Hapus Audit |
| `audit.review` | Review / Setujui Audit |
| `audit.approve` | Approve Final |
| `evidence.upload` | Upload Evidence |
| `user.view` | Lihat User |
| `user.manage` | Kelola User (CRUD) |
| `entity.view` | Lihat Entitas |
| `entity.manage` | Kelola Entitas |
| `template.manage` | Kelola Template |
| `stats.view` | Lihat Statistik |
| `role.manage` | Kelola Role & Permission |

```sql
CREATE TABLE permissions (
  id    INT PRIMARY KEY,
  code  TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL
);
```

### `role_permissions`
Mapping role → permission + scope:

```sql
CREATE TABLE role_permissions (
  role_id       INT REFERENCES roles(id),
  permission_id INT REFERENCES permissions(id),
  scope         TEXT NOT NULL DEFAULT 'bidang'
                CHECK (scope IN ('bidang', 'all')),
  PRIMARY KEY (role_id, permission_id)
);
```

- `'bidang'` = hanya dalam Irban sendiri
- `'all'` = lintas Irban (untuk Inspektur, Sekretaris)

## 3. Perubahan Tabel Existing

```sql
ALTER TABLE profiles        ADD COLUMN bidang_id INT REFERENCES bidang(id);
ALTER TABLE audits          ADD COLUMN bidang_id INT REFERENCES bidang(id);
ALTER TABLE target_entities ADD COLUMN bidang_id INT REFERENCES bidang(id);
ALTER TABLE templates       ADD COLUMN bidang_id INT REFERENCES bidang(id);
```

### Catatan: `profiles.role`

Kolom `role` tetap TEXT, bukan INT FK. Ini meminimalkan refactor di kode React
(yang banyak menggunakan `profile.role === 'Inspektur'`). Tapi constraint CHECK
di-update untuk menambahkan `'Sekretaris'` dan `'PPPK'`:

```sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
    'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
    'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
    'Inspektur Pembantu', 'Inspektur', 'Sekretaris', 'PPPK'
  ));
```

Data existing (milik Irban IV) di-set:

```sql
UPDATE audits          SET bidang_id = 4;
UPDATE target_entities SET bidang_id = 4;
UPDATE templates       SET bidang_id = 4;
```

## 4. Default Role → Permission Mapping

| Role | Permission (scope) |
|------|-------------------|
| Inspektur | Semua (`all`) |
| Sekretaris | Semua (`all`) |
| Inspektur Pembantu | Semua (`bidang`) |
| Auditor Ahli Utama/Madya/Muda | audit.view, audit.create, audit.edit, evidence.upload, entity.view, stats.view (`bidang`) |
| Auditor Ahli Pertama | audit.view, audit.edit, evidence.upload, entity.view, stats.view (`bidang`) |
| Auditor Penyelia/Lanjutan/Pelaksana | audit.view, evidence.upload, entity.view, stats.view (`bidang`) |
| PPUPD (semua level) | audit.view, evidence.upload, entity.view, stats.view (`bidang`) |
| PPPK | audit.view, evidence.upload (`bidang`) |

Semua bisa diubah lewat menu admin.

## 5. Data Access Layer

Setiap query ke audits, target_entities, templates — difilter berdasarkan `bidang_id` user:

```typescript
function getDataScope(user): string | null {
  const perm = getUserPermission(user, targetPermission);
  if (perm?.scope === 'all') return null; // no filter
  return user.bidang_id;
}
```

- **Inspektur / Sekretaris** — scope `all` → filter tidak aktif, lihat semua
- **Lainnya** — scope `bidang` → `WHERE bidang_id = {user.bidang_id}`

## 6. Admin UI

Menu baru **"Role & Permission"** dengan 3 bagian:

1. **Daftar Role** — tabel semua role, tombol tambah role baru (input nama + ID)
2. **Detail Role** — toggle permission on/off + pilih scope (`Bidang` / `Semua`)
3. **Assign Role ke User** — di halaman User Management, dropdown role dari tabel `roles`

Menu ini hanya bisa diakses oleh role dengan permission `role.manage` scope `all`.

## 7. Migration Strategy

1. Generate migration SQL (tabel baru + seed data + alter existing)
2. Jalankan di Supabase SQL Editor
3. Deploy kode React yang sudah diupdate
4. Data existing aman — semua di-set ke Irban IV

## 8. Non-Goals

- Tidak ada full audit trail (log perubahan permission)
- Tidak ada session-based multi-bidang (user login satu Irban, tidak bisa switch Irban dari UI)
- Tidak ada RLS di Supabase untuk sekarang (permission tetap di client-side)
