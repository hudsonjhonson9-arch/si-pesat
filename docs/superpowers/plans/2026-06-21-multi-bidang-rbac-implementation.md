# Multi-Bidang & RBAC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scale SI-PESAT from single-wilayah (Irban IV) to multi-bidang (Irban I—V) with database-driven RBAC that can be configured via admin UI.

**Architecture:** Add `bidang` table + `roles`/`permissions`/`role_permissions` tables to Supabase. Replace hardcoded `userRole` string checks with a permission hook that queries `role_permissions`. Add bidang_id FK to profiles, audits, target_entities, templates. Build admin UI to manage roles & permissions.

**Tech Stack:** Supabase PostgreSQL, React 19 + TypeScript 5.8, Tailwind CSS 4, Lucide React

**Spec:** `docs/superpowers/specs/2026-06-21-multi-bidang-rbac-design.md`

## Global Constraints

- `profiles.role` remains TEXT (not INT FK) to minimize refactor of existing code
- All permission checks go through a central `can()` function, never direct role string comparison in new code
- Data existing (Irban IV) gets `bidang_id = 4`
- No RLS changes in this plan; permission stays client-side
- No test framework — verify by manual review and `npm run lint` (tsc --noEmit)
- All new UI text in Bahasa Indonesia

---

### Task 1: Database Migration SQL

**Files:**
- Create: `supabase/migrations/20260621_multi_bidang_rbac.sql`

**Interfaces:**
- Consumes: N/A (seed data from existing schema)
- Produces: Database tables and columns consumed by all subsequent tasks

- [ ] **Step 1: Write migration SQL**

```sql
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

-- 2. Tabel roles (15 role)
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

-- Seed default mappings
-- Inspektur (13): all scope
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 13, id, 'all' FROM permissions
ON CONFLICT DO NOTHING;

-- Sekretaris (14): all scope
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 14, id, 'all' FROM permissions
ON CONFLICT DO NOTHING;

-- Inspektur Pembantu (12): semua bidang scope
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 12, id, 'bidang' FROM permissions
ON CONFLICT DO NOTHING;

-- Auditor Ahli Utama(7), Madya(6), Muda(5):
-- audit.view, audit.create, audit.edit, evidence.upload, entity.view, stats.view (bidang)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT r.id, p.id, 'bidang'
FROM (VALUES (5),(6),(7)) AS r(id), permissions p
WHERE p.code IN ('audit.view','audit.create','audit.edit','evidence.upload','entity.view','stats.view')
ON CONFLICT DO NOTHING;

-- Auditor Ahli Pertama (4):
-- audit.view, audit.edit, evidence.upload, entity.view, stats.view (bidang)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT 4, id, 'bidang' FROM permissions
WHERE code IN ('audit.view','audit.edit','evidence.upload','entity.view','stats.view')
ON CONFLICT DO NOTHING;

-- Auditor Penyelia(3), Pelaksana Lanjutan(2), Pelaksana(1):
-- audit.view, evidence.upload, entity.view, stats.view (bidang)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT r.id, p.id, 'bidang'
FROM (VALUES (1),(2),(3)) AS r(id), permissions p
WHERE p.code IN ('audit.view','evidence.upload','entity.view','stats.view')
ON CONFLICT DO NOTHING;

-- PPUPD semua level (8-11): audit.view, evidence.upload, entity.view, stats.view (bidang)
INSERT INTO role_permissions (role_id, permission_id, scope)
SELECT r.id, p.id, 'bidang'
FROM (VALUES (8),(9),(10),(11)) AS r(id), permissions p
WHERE p.code IN ('audit.view','evidence.upload','entity.view','stats.view')
ON CONFLICT DO NOTHING;

-- PPPK (15): audit.view, evidence.upload (bidang)
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

-- 7. Update constraint profiles.role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
    'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
    'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
    'Inspektur Pembantu', 'Inspektur', 'Sekretaris', 'PPPK'
  ));
```

- [ ] **Step 2: Verify migration**

Run the SQL in Supabase SQL Editor. Verify:
```sql
SELECT * FROM bidang;          -- 5 rows
SELECT * FROM roles;           -- 15 rows
SELECT * FROM permissions;     -- 14 rows
SELECT * FROM role_permissions; -- check mappings exist
SELECT id, bidang_id FROM audits LIMIT 5; -- semua >= 4
```

- [ ] **Step 3: Update `supabase_schema.sql`**

Copy the migration content into `supabase_schema.sql` so fresh installs get the new tables automatically.

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types.ts`

**Interfaces:**
- Consumes: Database schema from Task 1
- Produces: Types consumed by all subsequent tasks

- [ ] **Step 1: Add new interfaces to `src/types.ts`**

```typescript
// === Multi-Bidang & RBAC Types ===

export interface Bidang {
  id: number;
  name: string;
  wilayah?: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface Permission {
  id: number;
  code: string;
  label: string;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
  scope: 'bidang' | 'all';
}
```

- [ ] **Step 2: Add `bidang_id` to existing interfaces**

```typescript
export interface UserProfile {
  // ... existing fields
  bidang_id?: number;  // NEW
}

export interface OpdAudit {
  // ... existing fields
  bidang_id?: number;  // NEW
}

export interface TargetEntity {
  // ... existing fields
  bidang_id?: number;  // NEW
}

export interface KKATemplate {
  // ... existing fields
  bidang_id?: number;  // NEW
}
```

- [ ] **Step 3: Verify**

Run `npm run lint` — should pass with no errors.

---

### Task 3: Permission Hook (`usePermission`)

**Files:**
- Create: `src/lib/permissions.ts`
- Modify: `src/lib/supabase.ts`

**Interfaces:**
- Consumes: `RolePermission[]`, `UserProfile`
- Produces: `can(code: string): boolean` function used by all components

- [ ] **Step 1: Write `src/lib/permissions.ts`**

```typescript
import { RolePermission } from '../types';

export class PermissionChecker {
  private rolePermissions: RolePermission[] = [];
  private userRoleId: number | null = null;
  private userBidangId: number | null = null;

  setRolePermissions(rp: RolePermission[]) {
    this.rolePermissions = rp;
  }

  setUser(roleId: number | null, bidangId: number | null) {
    this.userRoleId = roleId;
    this.userBidangId = bidangId;
  }

  can(permissionCode: string): boolean {
    if (!this.userRoleId) return false;
    return this.rolePermissions.some(
      rp => rp.role_id === this.userRoleId &&
        this.matchPermissionCode(rp.permission_id, permissionCode)
    );
  }

  getScope(permissionCode: string): 'bidang' | 'all' | null {
    const rp = this.rolePermissions.find(
      rp => rp.role_id === this.userRoleId &&
        this.matchPermissionCode(rp.permission_id, permissionCode)
    );
    return rp?.scope || null;
  }

  shouldFilterByBidang(permissionCode: string): boolean {
    return this.getScope(permissionCode) !== 'all';
  }

  private permissionCodeMap: Map<number, string> = new Map();
  setPermissionCodeMap(map: Map<number, string>) {
    this.permissionCodeMap = map;
  }

  private matchPermissionCode(permId: number, code: string): boolean {
    return this.permissionCodeMap.get(permId) === code;
  }
}

// Singleton
export const permissionChecker = new PermissionChecker();
```

- [ ] **Step 2: Verify**

```bash
npm run lint
```

---

### Task 4: Integrate Permission System into App.tsx

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: PermissionChecker, bidang/roles/permissions/role_permissions tables
- Produces: `permissionChecker` populated with data; `userBidangId` passed to components

- [ ] **Step 1: Add state for new entities**

```typescript
const [bidangList, setBidangList] = useState<Bidang[]>([]);
const [userBidangId, setUserBidangId] = useState<number | null>(null);
const [rolesList, setRolesList] = useState<Role[]>([]);
const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
```

- [ ] **Step 2: Load bidang/roles/permissions on auth**

In the auth state effect (`useEffect` with `supabase.auth.onAuthStateChange`), after fetching profile, also fetch:

```typescript
// Fetch bidang data
supabase.from('bidang').select('*').then(({ data }) => {
  if (data) setBidangList(data);
});

// Fetch roles list
supabase.from('roles').select('*').then(({ data }) => {
  if (data) setRolesList(data);
});

// Fetch permissions list
supabase.from('permissions').select('*').then(({ data }) => {
  if (data) {
    setPermissionsList(data);
    const map = new Map<number, string>();
    data.forEach(p => map.set(p.id, p.code));
    permissionChecker.setPermissionCodeMap(map);
  }
});

// Fetch role_permissions
supabase.from('role_permissions').select('*').then(({ data }) => {
  if (data) permissionChecker.setRolePermissions(data);
});

// Get user's role_id from roles table and bidang_id from profile
const roleRow = rolesList.find(r => r.name === userRole);
const profileRow = userProfiles.find(p => p.id === user?.id);
if (roleRow && profileRow) {
  permissionChecker.setUser(roleRow.id, profileRow.bidang_id ?? null);
  if (profileRow.bidang_id) setUserBidangId(profileRow.bidang_id);
}
```

- [ ] **Step 3: Filter audits by bidang_id**

In `fetchAudits()`, modify the Supabase query:

```typescript
const isInspekturOrSekretaris = permissionChecker.shouldFilterByBidang('audit.view') === false;
let query = supabase.from('audits').select('*');
if (!isInspekturOrSekretaris && userBidangId) {
  query = query.eq('bidang_id', userBidangId);
}
const { data, error } = await query;
```

- [ ] **Step 4: Filter target_entities by bidang_id**

Same pattern in the auth effect where target_entities is fetched.

- [ ] **Step 5: Update sync payload to include bidang_id**

In the debounced sync effect, add `bidang_id: userBidangId` to the audit upsert payload.

- [ ] **Step 6: Verify**

```bash
npm run lint
```

---

### Task 5: Update Permission Checks Across All Components

**Files:**
- Modify: `src/App.tsx` (nav bars — role checks replaced with `permissionChecker.can()`)
- Modify: `src/components/HomeView.tsx`
- Modify: `src/components/AuditListView.tsx`
- Modify: `src/components/AuditWorkspaceView.tsx`
- Modify: `src/components/NewAuditView.tsx`
- Modify: `src/components/TemplateConfiguratorView.tsx`
- Modify: `src/components/UserManagementView.tsx`
- Modify: `src/components/StatistikView.tsx`

- [ ] **Step 1: App.tsx — replace role checks in nav**

In header nav: replace hardcoded role checks with permission-based checks:

```typescript
// Sebelum
{(userRole === 'Inspektur' || userRole === 'Inspektur Pembantu' || isAdmin) && (
  <button onClick={() => navigateTo('jenis-audit')}>Jenis Audit</button>
)}

// Sesudah
{permissionChecker.can('template.manage') && (
  <button onClick={() => navigateTo('jenis-audit')}>Jenis Audit</button>
)}
```

Same pattern for:
- "Pengguna" nav button → `permissionChecker.can('user.manage')`
- Mobile bottom nav "Lainnya" sheet → same replacements

- [ ] **Step 2: Pass `permissionChecker` or `can` function to child components**

Instead of passing `userRole` and `isAdmin` to every component, create a context or pass `can` function:

```typescript
// In App.tsx's renderContent:
<HomeView
  targetEntities={targetEntities}
  audits={audits}
  onSelectAudit={...}
  can={permissionChecker.can.bind(permissionChecker)}
  userBidangId={userBidangId}
/>
```

- [ ] **Step 3: Update HomeView.tsx**

Replace:
- `"SI-PESAT IRBAN IV"` → get brand name from `bidangList` by `userBidangId`
- `"Inspektur Pembantu Wilayah IV"` → dynamic per bidang
- `"Penatausahaan KKA Irban IV."` → dynamic
- Hardcoded role checks → `can()` function

- [ ] **Step 4: Update AuditWorkspaceView.tsx**

Replace:
- `userRole === 'Inspektur' || userRole === 'Inspektur Pembantu'` → `can('audit.review')`
- `userRole === 'Inspektur'` for approval → `can('audit.approve')`

- [ ] **Step 5: Update remaining components**

- `AuditListView.tsx` — replace edit/delete visibility checks with `can()`
- `NewAuditView.tsx` — replace role checks
- `TemplateConfiguratorView.tsx` — replace with `can('template.manage')`
- `StatistikView.tsx` — replace with `can('stats.view')`

- [ ] **Step 6: Verify**

```bash
npm run lint
```

---

### Task 6: Update User Management — Bidang & New Roles

**Files:**
- Modify: `src/components/UserManagementView.tsx`

- [ ] **Step 1: Add bidang dropdown to add/edit user forms**

Replace/add in the add user modal and inline edit form:

```typescript
// New state
const [bidangList, setBidangList] = useState<Bidang[]>([]);
const [addBidangId, setAddBidangId] = useState<number>(4); // default Irban IV

// Fetch bidang list on mount
useEffect(() => {
  supabase.from('bidang').select('*').then(({ data }) => {
    if (data) setBidangList(data);
  });
}, []);
```

Add bidang dropdown to add/edit forms:
```tsx
<select value={addBidangId} onChange={e => setAddBidangId(Number(e.target.value))}>
  {bidangList.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
</select>
```

In the upsert payload, include `bidang_id`.

- [ ] **Step 2: Update `ROLE_OPTIONS` to include Sekretaris & PPPK**

```typescript
const ROLE_OPTIONS = [
  'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
  'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
  'Inspektur Pembantu', 'Inspektur', 'Sekretaris', 'PPPK'
] as const;
```

- [ ] **Step 3: Sort user list by bidang then role**

```typescript
// In filteredProfiles sort:
.sort((a, b) => {
  const bidangDiff = (a.bidang_id ?? 99) - (b.bidang_id ?? 99);
  if (bidangDiff !== 0) return bidangDiff;
  // then by role order, golongan, name...
})
```

- [ ] **Step 4: Show bidang badge in user table**

```tsx
// In the user table row
<span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
  {bidangList.find(b => b.id === profile.bidang_id)?.name || '—'}
</span>
```

- [ ] **Step 5: Filter users per bidang for non-Inspektur roles**

```typescript
const filteredProfiles = useMemo(() => {
  return userProfiles
    .filter(p => {
      // Non-Inspektur/Sekretaris only see their own bidang users
      if (permissionChecker.shouldFilterByBidang('user.view')) {
        return p.bidang_id === userBidangId;
      }
      return true;
    })
    // ... rest of filters
}, [userProfiles, searchQuery, roleFilter, userBidangId]);
```

- [ ] **Step 6: Verify**

```bash
npm run lint
```

---

### Task 7: Role & Permission Admin UI

**Files:**
- Create: `src/components/RolePermissionView.tsx`
- Modify: `src/App.tsx` (add routing, nav link, import)

- [ ] **Step 1: Create `RolePermissionView.tsx`**

Component with 3 sections:

**A. Role List (left panel / top section):**
- Table of all roles from `roles` table
- "Tambah Role Baru" button
- Click role → show permission editor

**B. Permission Editor (main area):**
- For selected role, show all permissions as a grid of toggle cards
- Each card: permission label, on/off toggle, scope dropdown (`Bidang` / `Semua`)
- "Simpan" button → upsert to `role_permissions`
- "Reset ke Default" button

**C. Tambah Role Baru modal:**
- Input: nama role
- On save: INSERT into `roles` table

```tsx
export default function RolePermissionView({
  rolesList,
  permissionsList,
  bidangList,
  onShowToast,
}) {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [localPerms, setLocalPerms] = useState<Record<string, { enabled: boolean; scope: 'bidang' | 'all' }>>({});

  // Load role_permissions for selected role
  useEffect(() => {
    if (!selectedRoleId) return;
    supabase.from('role_permissions')
      .select('*')
      .eq('role_id', selectedRoleId)
      .then(({ data }) => {
        if (!data) return;
        const permMap: Record<string, { enabled: boolean; scope: 'bidang' | 'all' }> = {};
        permissionsList.forEach(p => {
          const rp = data.find(r => r.permission_id === p.id);
          permMap[p.code] = {
            enabled: !!rp,
            scope: rp?.scope || 'bidang',
          };
        });
        setLocalPerms(permMap);
      });
  }, [selectedRoleId]);

  const handleSave = async () => {
    if (!selectedRoleId) return;
    // Delete existing then re-insert
    await supabase.from('role_permissions').delete().eq('role_id', selectedRoleId);
    const inserts = Object.entries(localPerms)
      .filter(([, v]) => v.enabled)
      .map(([code, v]) => {
        const perm = permissionsList.find(p => p.code === code);
        return perm ? { role_id: selectedRoleId, permission_id: perm.id, scope: v.scope } : null;
      })
      .filter(Boolean);
    if (inserts.length > 0) {
      await supabase.from('role_permissions').insert(inserts);
    }
    onShowToast?.('Permission berhasil disimpan.', 'success');
  };

  // ... render UI
}
```

- [ ] **Step 2: Register route in App.tsx**

```typescript
// Add to navigation tabs union type
type ActiveTab = 'dashboard' | 'audits' | 'jenis-audit' | 'new-audit' | 'statistik' | 'profil' | 'pengguna' | 'role-permission';

// Add nav button (only for role.manage scope all users)
{permissionChecker.can('role.manage') && (
  <button onClick={() => navigateTo('role-permission')}>
    {/* ... */}
  </button>
)}

// Add to renderContent switch
case 'role-permission':
  return <RolePermissionView rolesList={rolesList} permissionsList={permissionsList} bidangList={bidangList} onShowToast={showToast} />;
```

- [ ] **Step 3: Verify**

```bash
npm run lint
```

---

### Task 8: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update header description from single-Irban to multi-bidang**

```markdown
**Sistem pengelolaan Kertas Kerja Audit (KKA) berbasis web untuk Inspektorat Kabupaten Sumba Barat — multi-bidang (Irban I—V).**
```

- [ ] **Step 2: Update "Tentang Proyek" to reflect multi-Irban scope**

- [ ] **Step 3: Add Bidang table to Database Schema section**

```markdown
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
```

- [ ] **Step 4: Update Struktur Proyek**

Add:
```
├── src/lib/permissions.ts     # Permission checker
├── src/components/RolePermissionView.tsx  # Role & permission admin UI
```

- [ ] **Step 5: Update "Peran & Hak Akses" section**

Add Sekretaris and PPPK roles. Replace the access matrix note with:
> **Hak akses sekarang dikonfigurasi via menu Role & Permission.** Admin/Inspektur dapat mengatur permission per role tanpa koding.

- [ ] **Step 6: Replace "Single Irban" references**

Any remaining "Irban IV" references in README should be updated to reflect multi-bidang.

- [ ] **Step 7: Add migration instructions**

Add a subsection for the multi-bidang migration:
```markdown
### Multi-Bidang Migration (v2.0+)

Jalankan `supabase/migrations/20260621_multi_bidang_rbac.sql` di SQL Editor.
```

- [ ] **Step 8: Verify**

```bash
npm run lint
```

---

### Task 9: Final Verification & Cleanup

**Files:**
- Modify: All files touched above

- [ ] **Step 1: Global search for remaining hardcoded Irban IV references**

Search for `Irban IV`, `IRBAN IV`, `Irban 4`, `Loli` in source files and replace with dynamic references from bidang data.

- [ ] **Step 2: Global search for remaining `userRole ===` hardcoded role checks**

Search for patterns like `userRole === 'Inspektur'` or `userRole === 'Inspektur Pembantu'` and replace with `can()` calls.

- [ ] **Step 3: Run full build**

```bash
npm run build
```

Verify no TypeScript errors and the build succeeds.

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Verify clean output.

- [ ] **Step 5: Manual smoke check checklist**
  - Login as Inspektur → can see all Irban data
  - Login as Inspektur Pembantu → only sees own Irban
  - User Management shows bidang dropdown
  - Role & Permission menu visible only for Inspektur/Sekretaris
  - Can toggle permissions and save
  - Dashboard shows correct bidang branding
  - Create audit → bidang_id is saved
  - Offline session still works
