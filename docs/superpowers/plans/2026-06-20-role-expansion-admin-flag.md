# Role Expansion & Admin Flag — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand roles from 3 to 13 (Auditor fungsional, PPUPD, Struktural), add `is_admin` flag, and restrict Ketua Tim to Muda-level above.

**Architecture:** Minimal approach — add new roles to DB constraint + TypeScript + UI dropdowns; add `is_admin` boolean column + toggle in UserManagementView; filter Ketua Tim dropdowns using a constant array; update scattered `.includes()` checks to use helper arrays.

**Tech Stack:** React, TypeScript, Supabase, Vite

## Global Constraints

- Follow existing code patterns (`.includes()` role checks, component-level permission booleans)
- No backend RLS changes (client-side permission only)
- Verify with `npm run lint` (runs `tsc --noEmit`)

---

### Task 1: Database Migration + TypeScript Types

**Files:**
- Modify: `supabase_schema.sql`
- Modify: `src/types.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `UserProfile` with `isAdmin` field; DB with new roles + `is_admin` column

- [ ] **Step 1: Update `supabase_schema.sql`**

Add `is_admin` column and update role CHECK constraint:

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
```

Also update the CREATE TABLE statement in the same file to include `is_admin BOOLEAN DEFAULT false` in the `profiles` table definition.

- [ ] **Step 2: Update `src/types.ts`**

Add `is_admin` to `UserProfile`:

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

- [ ] **Step 3: Verify**

Run: `npm run lint` — Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add supabase_schema.sql src/types.ts
git commit -m "feat: add is_admin column and expand role CHECK constraint to 13 roles"
```

---

### Task 2: App.tsx — isAdmin State + Prop Passing

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `UserProfile` from Task 1 (has `is_admin`)
- Produces: `isAdmin` boolean state; `isAdmin` prop passed to child components

- [ ] **Step 1: Add `isAdmin` state**

Find the existing `userRole` state declaration (around line 91). Add after it:

```typescript
const [isAdmin, setIsAdmin] = useState(false);
```

- [ ] **Step 2: Fetch `is_admin` in auth flow**

Find the auth session handler (around line 367). The current code fetches role from profiles. Update to also fetch `is_admin`:

Change:
```typescript
const { data: roleData } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', session.user.id)
  .single();
if (roleData?.role) setUserRole(roleData.role);
```

To:
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role, is_admin')
  .eq('id', session.user.id)
  .single();
if (profile) {
  setUserRole(profile.role || '');
  setIsAdmin(profile.is_admin || false);
}
```

Find the session login handler (around line 428) and set `isAdmin` from localStorage or default false:
```typescript
setIsAdmin(false);
```

Find the localStorage persist block. Change the initial state to read from localStorage:
```typescript
const [isAdmin, setIsAdmin] = useState(localStorage.getItem('si_pesat_is_admin') === 'true');
```

Find where `userRole` is saved to localStorage (around line 273) and add:
```typescript
localStorage.setItem('si_pesat_is_admin', JSON.stringify(isAdmin));
```

- [ ] **Step 3: Pass `isAdmin` to child components**

Find each render of the following components and add `isAdmin={isAdmin}` prop:

In the JSX, find these component usages and add the prop:

**`AuditListView`:**
```tsx
<AuditListView
  ...
  userRole={userRole}
  isAdmin={isAdmin}
/>
```

**`UserManagementView`:**
```tsx
<UserManagementView
  ...
  currentUserRole={userRole}
  isAdmin={isAdmin}
/>
```

**`HomeView`:**
```tsx
<HomeView
  ...
  userRole={userRole}
  isAdmin={isAdmin}
/>
```

**`AuditWorkspaceView`:**
```tsx
<AuditWorkspaceView
  ...
  userRole={userRole}
  isAdmin={isAdmin}
/>
```

- [ ] **Step 4: Update nav permission checks**

Replace hardcoded `'Admin'` string with `isAdmin`:

Line ~794 — "Jenis Audit" nav button:
Change from:
```typescript
{['Inspektur', 'Inspektur Pembantu', 'Admin'].includes(userRole) && (
```
To:
```typescript
{(userRole === 'Inspektur' || userRole === 'Inspektur Pembantu' || isAdmin) && (
```

Line ~880 — mobile bottom nav:
Change from:
```typescript
['Admin'].includes(userRole) ? 'grid-cols-6' : 'grid-cols-5'
```
To:
```typescript
isAdmin ? 'grid-cols-6' : 'grid-cols-5'
```

Line ~921 — "Jenis Audit" mobile nav:
Change from:
```typescript
{['Inspektur', 'Inspektur Pembantu', 'Admin'].includes(userRole) && (
```
To:
```typescript
{(userRole === 'Inspektur' || userRole === 'Inspektur Pembantu' || isAdmin) && (
```

- [ ] **Step 5: Verify**

Run: `npm run lint` — Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add isAdmin state, fetch from profiles, pass as prop, update nav checks"
```

---

### Task 3: UserManagementView — New Roles + is_admin Toggle

**Files:**
- Modify: `src/components/UserManagementView.tsx`

**Interfaces:**
- Consumes: `isAdmin` prop from Task 2; `UserProfile` with `is_admin` from Task 1
- Produces: Updated user management with 13 roles and `is_admin` toggle

- [ ] **Step 1: Update ROLE_OPTIONS**

Change:
```typescript
const ROLE_OPTIONS = ['Auditor', 'Inspektur Pembantu', 'Inspektur'] as const;
```
To:
```typescript
const ROLE_OPTIONS = [
  'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
  'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
  'Inspektur Pembantu', 'Inspektur'
] as const;
```

- [ ] **Step 2: Update ROLE_ORDER**

Change:
```typescript
const ROLE_ORDER: Record<string, number> = { 'Inspektur': 0, 'Inspektur Pembantu': 1, 'Auditor': 2 };
```
To:
```typescript
const ROLE_ORDER: Record<string, number> = {
  'Inspektur': 0, 'Inspektur Pembantu': 1,
  'Auditor Ahli Utama': 2, 'Auditor Ahli Madya': 3, 'Auditor Ahli Muda': 4, 'Auditor Ahli Pertama': 5,
  'Auditor Penyelia': 6, 'Auditor Pelaksana Lanjutan': 7, 'Auditor Pelaksana': 8,
  'PPUPD Ahli Utama': 9, 'PPUPD Ahli Madya': 10, 'PPUPD Ahli Muda': 11, 'PPUPD Ahli Pertama': 12,
};
```

- [ ] **Step 3: Update ROLE_CONFIG**

Change from 3 entries to include all roles. Group by type with appropriate icons/colors:

```typescript
const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  'Auditor Pelaksana': { label: 'Auditor Pelaksana', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Auditor Pelaksana Lanjutan': { label: 'Auditor Pelaksana Lanjutan', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Auditor Penyelia': { label: 'Auditor Penyelia', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Auditor Ahli Pertama': { label: 'Ahli Pertama', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Auditor Ahli Muda': { label: 'Ahli Muda', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Auditor Ahli Madya': { label: 'Ahli Madya', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'Auditor Ahli Utama': { label: 'Ahli Utama', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  'PPUPD Ahli Pertama': { label: 'PPUPD Ahli Pertama', icon: <Shield className="w-3.5 h-3.5" />, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'PPUPD Ahli Muda': { label: 'PPUPD Ahli Muda', icon: <Shield className="w-3.5 h-3.5" />, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'PPUPD Ahli Madya': { label: 'PPUPD Ahli Madya', icon: <Shield className="w-3.5 h-3.5" />, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'PPUPD Ahli Utama': { label: 'PPUPD Ahli Utama', icon: <Shield className="w-3.5 h-3.5" />, bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'Inspektur Pembantu': { label: 'Irban', icon: <Star className="w-3.5 h-3.5" />, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Inspektur: { label: 'Inspektur', icon: <Crown className="w-3.5 h-3.5" />, bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};
```

Need to ensure `Shield` is imported from `lucide-react` (it's already imported at line 10).

- [ ] **Step 4: Update `canEdit`, `canEditRole`, `canToggleMfa`**

Change:
```typescript
const canEdit = currentUserRole === 'Inspektur' || currentUserRole === 'Inspektur Pembantu';
const canEditRole = currentUserRole === 'Inspektur';
const canToggleMfa = currentUserRole === 'Inspektur';
```
To:
```typescript
const canEdit = currentUserRole === 'Inspektur' || currentUserRole === 'Inspektur Pembantu' || isAdmin;
const canEditRole = currentUserRole === 'Inspektur' || isAdmin;
const canToggleMfa = currentUserRole === 'Inspektur' || isAdmin;
```

Add `isAdmin` to the component props interface:
```typescript
interface UserManagementViewProps {
  userProfiles: UserProfile[];
  currentUserRole: string;
  currentUserId?: string;
  isAdmin?: boolean;
  onShowToast?: (message: string, type: 'success' | 'info' | 'error') => void;
  onRefreshProfiles?: () => void;
}
```

And destructure it in the function signature:
```typescript
export default function UserManagementView({
  userProfiles, currentUserRole, currentUserId, isAdmin = false, onShowToast, onRefreshProfiles,
}: UserManagementViewProps) {
```

- [ ] **Step 5: Add `is_admin` toggle in the edit form**

In the edit form section (around line 301-324, where MFA toggle is), add after the MFA toggle block:

```tsx
{/* Toggle is_admin */}
{canEditRole && (
  <div className="md:col-span-2">
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${editIsAdmin ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editIsAdmin ? 'bg-purple-100' : 'bg-slate-100'}`}>
          <ShieldCheck className={`w-4 h-4 ${editIsAdmin ? 'text-purple-600' : 'text-slate-500'}`} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-700">Administrator Sistem</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {editIsAdmin ? 'Aktif — dapat mengedit data pegawai, menghapus & membuat KKA' : 'Nonaktif — akses terbatas sesuai peran'}
          </p>
        </div>
      </div>
      <button type="button" onClick={() => setEditIsAdmin(v => !v)}
        className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-2 ${editIsAdmin ? 'bg-purple-500 border-purple-600' : 'bg-slate-300 border-slate-400'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editIsAdmin ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  </div>
)}
```

Need to add state:
```typescript
const [editIsAdmin, setEditIsAdmin] = useState(false);
```

Update `startEdit` to set `editIsAdmin`:
```typescript
setEditIsAdmin((profile as any).is_admin || false);
```

Update `saveEdit` to send `is_admin`:
```typescript
const { error: profileError } = await supabase
  .from('profiles')
  .update({
    role: editRole,
    nip: editNip || null,
    golongan: editGolongan || null,
    pangkat: editPangkat || null,
    full_name: editFullName || null,
    mfa_required: editMfaRequired,
    is_admin: editIsAdmin,
    ...(emailChanged && !isEditingSelf ? { email_pending: editEmail.trim() } : {}),
  })
  .eq('id', userId);
```

- [ ] **Step 6: Verify**

Run: `npm run lint` — Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/components/UserManagementView.tsx
git commit -m "feat: expand role list to 13 roles, add is_admin toggle in user edit form"
```

---

### Task 4: All Remaining File Updates — Ketua Tim Filter + Permission Checks

**Files:**
- Modify: `src/components/NewAuditView.tsx`
- Modify: `src/components/AuditWorkspaceView.tsx`
- Modify: `src/components/AuditListView.tsx`
- Modify: `src/components/HomeView.tsx`
- Modify: `src/components/UserProfileView.tsx`

**Interfaces:**
- Consumes: `isAdmin` prop from Task 2; new roles from Task 3
- Produces: All permission checks updated; Ketua Tim dropdowns filtered

- [ ] **Step 1: Add helper arrays at the top of each file that needs them**

Or better, define them once in a shared location. Since the codebase doesn't have a shared constants file, define inline at the top of each modified file:

In `NewAuditView.tsx`, add after imports:
```typescript
const KETUA_TIM_ROLES = [
  'Inspektur', 'Inspektur Pembantu',
  'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];
```

In `AuditWorkspaceView.tsx`, add after imports:
```typescript
const STRUKTURAL_ROLES = ['Inspektur', 'Inspektur Pembantu'];
const FUNGSIONAL_ROLES = [
  'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
  'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];
const KETUA_TIM_ROLES = [
  'Inspektur', 'Inspektur Pembantu',
  'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];
```

In `AuditListView.tsx`, add after imports:
```typescript
const STRUKTURAL_ROLES = ['Inspektur', 'Inspektur Pembantu'];
```

- [ ] **Step 2: Update `NewAuditView.tsx` — filter Ketua Tim dropdown**

Find the Ketua Tim dropdown filter (line 380):
```typescript
{userProfiles.filter(p => (p.full_name || p.email).toLowerCase().includes(catAuditorSearch.toLowerCase())).map(p => {
```

Change to:
```typescript
{userProfiles.filter(p => KETUA_TIM_ROLES.includes(p.role) && (p.full_name || p.email).toLowerCase().includes(catAuditorSearch.toLowerCase())).map(p => {
```

- [ ] **Step 3: Update `AuditWorkspaceView.tsx` — all changes**

**3a: Filter Ketua Tim dropdown in "Add Category" form (line ~1460):**

Change:
```typescript
{userProfiles
  .filter(p => (p.full_name || p.email).toLowerCase().includes(newCatAuditorSearchQuery.toLowerCase()))
```
To:
```typescript
{userProfiles
  .filter(p => KETUA_TIM_ROLES.includes(p.role) && (p.full_name || p.email).toLowerCase().includes(newCatAuditorSearchQuery.toLowerCase()))
```

**3b: Filter Ketua Tim dropdown in "Edit Team" form (line ~1596):**

Change:
```typescript
{userProfiles
  .filter(p => (p.full_name || p.email).toLowerCase().includes(editCatAuditorSearchQuery.toLowerCase()))
```
To:
```typescript
{userProfiles
  .filter(p => KETUA_TIM_ROLES.includes(p.role) && (p.full_name || p.email).toLowerCase().includes(editCatAuditorSearchQuery.toLowerCase()))
```

**3c: Update `userRole !== 'Auditor'` checks to use `FUNGSIONAL_ROLES` + `isAdmin`:**

Search for all occurrences of `userRole !== 'Auditor'` in the file (there are several, used for disabling fields for non-auditor roles). Replace each with:
```typescript
!FUNGSIONAL_ROLES.includes(userRole) && !isAdmin
```

Search for all occurrences of `userRole === 'Auditor'` (used for showing auditor-only controls). Replace with:
```typescript
FUNGSIONAL_ROLES.includes(userRole) || isAdmin
```

**3d: Update specific role checks:**

Search for `['Inspektur', 'Inspektur Pembantu']` or `userRole === 'Inspektur Pembantu' || userRole === 'Inspektur'`. Replace with:
```typescript
STRUKTURAL_ROLES.includes(userRole) || isAdmin
```

**3e: Update `userRole === 'Inspektur'` checks (Ketua Tim only). Replace with:**

```typescript
userRole === 'Inspektur' || isAdmin
```

**3f: Add `isAdmin` prop:**

Update the component interface to accept `isAdmin?: boolean` and destructure it with default `false`.

- [ ] **Step 4: Update `AuditListView.tsx` — delete KKA permission**

Find the delete button check (around line 382):
```typescript
{['Inspektur', 'Inspektur Pembantu', 'Admin'].includes(userRole) && (
```

Change to:
```typescript
{(STRUKTURAL_ROLES.includes(userRole) || isAdmin) && (
```

Update the component interface and destructure to accept `isAdmin?: boolean`.

- [ ] **Step 5: Update `HomeView.tsx` — role checks**

Find any role checks. The review banners use:
```typescript
userRole === 'Inspektur Pembantu' || userRole === 'Inspektur'
```

Replace with:
```typescript
userRole === 'Inspektur Pembantu' || userRole === 'Inspektur' || isAdmin
```

Update the component interface to accept `isAdmin?: boolean`.

- [ ] **Step 6: Update `UserProfileView.tsx` — role checks**

Similar to HomeView, find role checks:
```typescript
userRole === 'Inspektur Pembantu' || userRole === 'Inspektur'
```

Replace with:
```typescript
userRole === 'Inspektur Pembantu' || userRole === 'Inspektur' || isAdmin
```

Update the component interface to accept `isAdmin?: boolean`.

- [ ] **Step 7: Verify**

Run: `npm run lint` — Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/components/NewAuditView.tsx src/components/AuditWorkspaceView.tsx src/components/AuditListView.tsx src/components/HomeView.tsx src/components/UserProfileView.tsx
git commit -m "feat: add Ketua Tim role filtering, update permission checks across all components"
```
