### Task 2: App.tsx — isAdmin State + Prop Passing

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `UserProfile` from Task 1 (has `is_admin`)
- Produces: `isAdmin` boolean state; `isAdmin` prop passed to child components

- [ ] **Step 1: Add `isAdmin` state**

Find the existing `userRole` state declaration (around line 91 in current file). Add after it:

```typescript
const [isAdmin, setIsAdmin] = useState(localStorage.getItem('si_pesat_is_admin') === 'true');
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

Also update the other similar profile fetch (line ~387, teacher login fallback).

Find where `userRole` is saved to localStorage (around line 273) and add:
```typescript
localStorage.setItem('si_pesat_is_admin', JSON.stringify(isAdmin));
```

In the `handleSessionLogin` function (offline mode), set:
```typescript
setIsAdmin(false);
```

- [ ] **Step 3: Pass `isAdmin` to child components**

Find each render of the following components and add `isAdmin={isAdmin}` prop:

**`AuditListView`:** add `isAdmin={isAdmin}`
**`UserManagementView`:** add `isAdmin={isAdmin}`
**`HomeView`:** add `isAdmin={isAdmin}`
**`AuditWorkspaceView`:** add `isAdmin={isAdmin}`

Do NOT touch `NewAuditView` — it doesn't need isAdmin (it filters Ketua Tim by role, not admin status).

Search for existing `userRole={userRole}` prop passings to find these component usages.

- [ ] **Step 4: Update nav permission checks**

Replace hardcoded `'Admin'` string with `isAdmin`:

Find and replace in App.tsx:
1. `{['Inspektur', 'Inspektur Pembantu', 'Admin'].includes(userRole) && (` → `{(userRole === 'Inspektur' || userRole === 'Inspektur Pembantu' || isAdmin) && (`
2. `['Admin'].includes(userRole) ? 'grid-cols-6' : 'grid-cols-5'` → `isAdmin ? 'grid-cols-6' : 'grid-cols-5'`

There are 2 occurrences of pattern #1 (desktop and mobile nav for "Jenis Audit") and 1 occurrence of pattern #2.

- [ ] **Step 5: Verify**

Run: `npm run lint` — Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add isAdmin state, fetch from profiles, pass as prop, update nav checks"
```
