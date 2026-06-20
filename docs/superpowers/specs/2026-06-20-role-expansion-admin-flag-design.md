# Role Expansion & Admin Flag Design

**Goal:** Expand user roles from 3 to 13 covering Jabatan Fungsional Auditor, PPUPD, dan Struktural; add `is_admin` flag for user `muthia.salsabila@google.com`; and restrict Ketua Tim eligibility to Muda-level and above.

## Database Changes

**`profiles` table:**
- New column: `is_admin BOOLEAN DEFAULT false`
- Updated CHECK constraint on `role` to include all new roles

**Migration:**
```sql
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
    'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
    'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
    'Inspektur Pembantu', 'Inspektur'
  ));
UPDATE profiles SET is_admin = true WHERE email = 'muthia.salsabila@google.com';
```

## TypeScript Types

**`types.ts`** — Add `is_admin` to `UserProfile`:
```typescript
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  nip?: string;
  golongan?: string;
  pangkat?: string;
  is_admin?: boolean;
}
```

## UI — Role Assignment & Display (UserManagementView.tsx)

**Full Role List:**
```
Auditor Pelaksana, Auditor Pelaksana Lanjutan, Auditor Penyelia,
Auditor Ahli Pertama, Auditor Ahli Muda, Auditor Ahli Madya, Auditor Ahli Utama,
PPUPD Ahli Pertama, PPUPD Ahli Muda, PPUPD Ahli Madya, PPUPD Ahli Utama,
Inspektur Pembantu, Inspektur
```

**Sort Order (highest to lowest):**
```
Inspektur → Inspektur Pembantu → Auditor Ahli Utama → Madya → Muda → Pertama →
Auditor Penyelia → Pelaksana Lanjutan → Pelaksana →
PPUPD Utama → Madya → Muda → Pertama
```

**Display groups:**
- Inspektur: purple (Crown icon)
- Inspektur Pembantu: amber (Star icon)
- Auditor *: blue (UserIcon)
- PPUPD *: teal (Shield icon)

**is_admin toggle:** Toggle switch in edit form, only Inspektur can toggle it (same pattern as MFA toggle).

## Helper Constants

```typescript
const STRUKTURAL_ROLES = ['Inspektur', 'Inspektur Pembantu'];

const KETUA_TIM_ROLES = [
  'Inspektur', 'Inspektur Pembantu',
  'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];
```

## App.tsx — New State

Add `isAdmin` alongside `userRole`:
```typescript
const [isAdmin, setIsAdmin] = useState(false);
```
Fetch from profiles on auth change:
```typescript
const { data: profile } = await supabase.from('profiles')
  .select('role, is_admin').eq('id', session.user.id).single();
setUserRole(profile?.role || '');
setIsAdmin(profile?.is_admin || false);
```
Pass `isAdmin` prop to child components that need it.

## Helper Constants (shared file or inline per file)

```typescript
const STRUKTURAL_ROLES = ['Inspektur', 'Inspektur Pembantu'];

const KETUA_TIM_ROLES = [
  'Inspektur', 'Inspektur Pembantu',
  'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];

const FUNGSIONAL_ROLES = [
  'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
  'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];
```

## Permission Updates per File

| File | Change |
|------|--------|
| `App.tsx` (nav: Jenis Audit, Pengguna) | `STRUKTURAL_ROLES.includes(userRole) \|\| isAdmin` — replace old `['Admin']` hardcode |
| `App.tsx` (mobile bottom nav) | Same pattern, replace `'Admin'` string |
| `AuditListView.tsx` (delete KKA) | `STRUKTURAL_ROLES.includes(userRole) \|\| isAdmin` — replace old `'Admin'` hardcode |
| `UserManagementView.tsx` (canEdit) | `STRUKTURAL_ROLES.includes(userRole) \|\| isAdmin` |
| `UserManagementView.tsx` (canEditRole) | `role === 'Inspektur' \|\| isAdmin` |
| `UserManagementView.tsx` (canToggleMfa) | `role === 'Inspektur' \|\| isAdmin` |
| `AuditWorkspaceView.tsx` (item field disable) | Replace `userRole !== 'Auditor'` with `!FUNGSIONAL_ROLES.includes(userRole) && !isAdmin` |
| `AuditWorkspaceView.tsx` (category delete) | Replace `role === 'Inspektur Pembantu' \|\| role === 'Inspektur'` with `STRUKTURAL_ROLES.includes(role) \|\| isAdmin` |
| `HomeView.tsx` (review banners) | Already uses `Irban \|\| Inspektur` — keep as `STRUKTURAL_ROLES` |
| `UserProfileView.tsx` | Same as HomeView |

## Ketua Tim Filtering

Dropdowns in `NewAuditView.tsx` and `AuditWorkspaceView.tsx` (Ketua Tim selector) filter users to only those with roles in `KETUA_TIM_ROLES`. Anggota Tim dropdown remains unrestricted.
