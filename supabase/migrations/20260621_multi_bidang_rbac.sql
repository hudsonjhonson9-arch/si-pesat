-- 1. Tabel bidang
CREATE TABLE IF NOT EXISTS bidang (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  wilayah TEXT
);
INSERT INTO bidang (id, name, wilayah) VALUES
  (1, 'Irban I', NULL),
  (2, 'Irban II', NULL),
  (3, 'Irban III', NULL),
  (4, 'Irban IV', 'Kecamatan Loli'),
  (5, 'Irban V', NULL)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabel roles
CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
INSERT INTO roles (id, name) VALUES
  (1, 'Auditor Pelaksana'),
  (2, 'Auditor Pelaksana Lanjutan'),
  (3, 'Auditor Penyelia'),
  (4, 'Auditor Ahli Pertama'),
  (5, 'Auditor Ahli Muda'),
  (6, 'Auditor Ahli Madya'),
  (7, 'Auditor Ahli Utama'),
  (8, 'PPUPD Ahli Pertama'),
  (9, 'PPUPD Ahli Muda'),
  (10, 'PPUPD Ahli Madya'),
  (11, 'PPUPD Ahli Utama'),
  (12, 'Inspektur Pembantu'),
  (13, 'Inspektur'),
  (14, 'Sekretaris'),
  (15, 'PPPK')
ON CONFLICT (id) DO NOTHING;

-- 3. Tabel permissions
CREATE TABLE IF NOT EXISTS permissions (
  id INT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL
);
INSERT INTO permissions (id, code, label) VALUES
  (1,  'audit.view',     'Lihat Audit'),
  (2,  'audit.create',   'Buat Audit'),
  (3,  'audit.edit',     'Edit Audit'),
  (4,  'audit.delete',   'Hapus Audit'),
  (5,  'audit.review',   'Review / Setujui Audit'),
  (6,  'audit.approve',  'Approve Final'),
  (7,  'evidence.upload','Upload Evidence'),
  (8,  'user.view',      'Lihat User'),
  (9,  'user.manage',    'Kelola User'),
  (10, 'entity.view',    'Lihat Entitas'),
  (11, 'entity.manage',  'Kelola Entitas'),
  (12, 'template.manage','Kelola Template'),
  (13, 'stats.view',     'Lihat Statistik'),
  (14, 'role.manage',    'Kelola Role & Permission')
ON CONFLICT (id) DO NOTHING;

-- 4. Tabel role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT REFERENCES roles(id),
  permission_id INT REFERENCES permissions(id),
  scope TEXT NOT NULL DEFAULT 'bidang' CHECK (scope IN ('bidang', 'all')),
  PRIMARY KEY (role_id, permission_id)
);

-- Inspektur (13): all
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 13, id, 'all' FROM permissions
ON CONFLICT DO NOTHING;

-- Sekretaris (14): all
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 14, id, 'all' FROM permissions
ON CONFLICT DO NOTHING;

-- Irban (12): semua bidang
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 12, id, 'bidang' FROM permissions
ON CONFLICT DO NOTHING;

-- Auditor Ahli Utama(7), Madya(6), Muda(5)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT r.id, p.id, 'bidang'
FROM (VALUES (5),(6),(7)) AS r(id), permissions p
WHERE p.code IN ('audit.view','audit.create','audit.edit','evidence.upload','entity.view','stats.view')
ON CONFLICT DO NOTHING;

-- Auditor Ahli Pertama (4)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 4, id, 'bidang' FROM permissions
WHERE code IN ('audit.view','audit.edit','evidence.upload','entity.view','stats.view')
ON CONFLICT DO NOTHING;

-- Auditor Penyelia(3), Pelaksana Lanjutan(2), Pelaksana(1)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT r.id, p.id, 'bidang'
FROM (VALUES (1),(2),(3)) AS r(id), permissions p
WHERE p.code IN ('audit.view','evidence.upload','entity.view','stats.view')
ON CONFLICT DO NOTHING;

-- PPUPD (8-11)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT r.id, p.id, 'bidang'
FROM (VALUES (8),(9),(10),(11)) AS r(id), permissions p
WHERE p.code IN ('audit.view','evidence.upload','entity.view','stats.view')
ON CONFLICT DO NOTHING;

-- PPPK (15)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 15, id, 'bidang' FROM permissions
WHERE code IN ('audit.view','evidence.upload')
ON CONFLICT DO NOTHING;

-- 5. Tambah kolom bidang_id
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bidang_id INT REFERENCES bidang(id);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS bidang_id INT REFERENCES bidang(id);
ALTER TABLE target_entities ADD COLUMN IF NOT EXISTS bidang_id INT REFERENCES bidang(id);
ALTER TABLE templates ADD COLUMN IF NOT EXISTS bidang_id INT REFERENCES bidang(id);

-- 6. Data existing → Irban IV
UPDATE audits SET bidang_id = 4 WHERE bidang_id IS NULL;
UPDATE target_entities SET bidang_id = 4 WHERE bidang_id IS NULL;
UPDATE templates SET bidang_id = 4 WHERE bidang_id IS NULL;

-- 7. Update constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
    'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
    'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
    'Inspektur Pembantu', 'Inspektur', 'Sekretaris', 'PPPK'
  ));
