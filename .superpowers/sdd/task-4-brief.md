### Task 4: All Remaining File Updates — Ketua Tim Filter + Permission Checks

**Files:**
- Modify: `src/components/NewAuditView.tsx`
- Modify: `src/components/AuditWorkspaceView.tsx`
- Modify: `src/components/AuditListView.tsx`
- Modify: `src/components/HomeView.tsx`
- Modify: `src/components/UserProfileView.tsx`

**Interfaces:**
- Consumes: `isAdmin` prop from App.tsx (Task 2); new roles from Task 3; `isAdmin?: boolean` already in HomeView/AuditListView/AuditWorkspaceView interfaces from Task 2
- Produces: All permission checks updated; Ketua Tim dropdowns filtered

---

**IMPORTANT:** Some components already have `isAdmin?: boolean` in their interfaces (HomeView, AuditListView, AuditWorkspaceView) from Task 2. DO NOT re-add it. For NewAuditView, you need to add it.

---

- [ ] **Step 1: Add helper arrays in each file**

**In `NewAuditView.tsx`, add after imports:**
```typescript
const KETUA_TIM_ROLES = [
  'Inspektur', 'Inspektur Pembantu',
  'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];
```

**In `AuditWorkspaceView.tsx`, add after imports:**
```typescript
const KETUA_TIM_ROLES = [
  'Inspektur', 'Inspektur Pembantu',
  'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];
const STRUKTURAL_ROLES = ['Inspektur', 'Inspektur Pembantu'];
```

**In `AuditListView.tsx`, add after imports:**
```typescript
const STRUKTURAL_ROLES = ['Inspektur', 'Inspektur Pembantu'];
```

- [ ] **Step 2: NewAuditView.tsx — filter Ketua Tim dropdown**

First, add `isAdmin?: boolean` to the component's Props interface and destructure it. The interface name is the first one that includes `userProfiles`.

Find the Ketua Tim dropdown user filter (it shows ALL profiles, now filter to only Ketua Tim eligible):

Change line that looks like:
```typescript
{userProfiles.filter(p => (p.full_name || p.email).toLowerCase().includes(catAuditorSearch.toLowerCase())).map(p => {
```

To:
```typescript
{userProfiles.filter(p => KETUA_TIM_ROLES.includes(p.role) && (p.full_name || p.email).toLowerCase().includes(catAuditorSearch.toLowerCase())).map(p => {
```

- [ ] **Step 3: AuditWorkspaceView.tsx — Ketua Tim filtering + role checks**

**3a: Filter Ketua Tim in "Add Category" form**

Find the new category Ketua Tim dropdown filter (similar pattern to Step 2) and add `KETUA_TIM_ROLES.includes(p.role) &&` to the filter.

**3b: Filter Ketua Tim in "Edit Team" form**

Find the edit category Ketua Tim dropdown filter and add `KETUA_TIM_ROLES.includes(p.role) &&` to the filter.

**3c: Update role checks involving `'Admin'` or structural roles**

Search for:
- `STRUKTURAL_ROLES.includes(userRole) || isAdmin` — replace any `['Inspektur', 'Inspektur Pembantu', 'Admin']` or similar patterns
- `userRole === 'Inspektur' || isAdmin` — for Inspektur-only checks

**3d: UPDATE `userRole === 'Auditor'` checks to use FUNGSIONAL_ROLES**

The old code uses `userRole === 'Auditor'` to check if a user can edit audit items. Now these roles should also be treated as functional auditor roles: Auditor Pelaksana, Pelaksana Lanjutan, Penyelia, Ahli Pertama, Ahli Muda, Ahli Madya, Ahli Utama, PPUPD Ahli Pertama, PPUPD Ahli Muda, PPUPD Ahli Madya, PPUPD Ahli Utama.

Add this constant after the other constants:
```typescript
const FUNGSIONAL_ROLES = [
  'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
  'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
];
```

Replace ALL occurrences of:
- `userRole === 'Auditor'` → `FUNGSIONAL_ROLES.includes(userRole)`
- `userRole !== 'Auditor'` → `!FUNGSIONAL_ROLES.includes(userRole) && !isAdmin`

Search the entire file for these patterns. There are likely ~10+ occurrences.

- [ ] **Step 4: AuditListView.tsx — delete KKA permission**

Find the delete button check (it uses `'Admin'` string). Replace:
```typescript
{['Inspektur', 'Inspektur Pembantu', 'Admin'].includes(userRole) && (
```
With:
```typescript
{(STRUKTURAL_ROLES.includes(userRole) || isAdmin) && (
```

- [ ] **Step 5: HomeView.tsx — role checks**

Find role checks that use `userRole === 'Inspektur Pembantu' || userRole === 'Inspektur'` and also include `|| isAdmin`.

HomeView already has `isAdmin?: boolean` in its props from Task 2. Just destructure it with default `false`.

- [ ] **Step 6: UserProfileView.tsx — role checks**

Similarly find role checks and add `|| isAdmin` to any structural-only checks.

Note: `UserProfileView.tsx` does NOT yet have `isAdmin` prop. Add it to the interface, destructure it, and use it in role checks.

- [ ] **Step 7: Verify**

Run: `npm run lint` — Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/components/NewAuditView.tsx src/components/AuditWorkspaceView.tsx src/components/AuditListView.tsx src/components/HomeView.tsx src/components/UserProfileView.tsx
git commit -m "feat: add Ketua Tim role filtering, update permission checks across all components"
```
