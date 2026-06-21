# Task 4: Integrate Permission System into App.tsx

**Files:**
- Modify: `src/App.tsx`

**Goal:** Add bidang/permission state to App.tsx, load data from Supabase on auth, filter audits/target_entities by bidang_id, include bidang_id in sync payload.

## Requirements

### 1. New imports
Add to existing imports in App.tsx:
```typescript
import { Bidang, Role, Permission, RolePermission } from './types';
import { permissionChecker } from './lib/permissions';
```

### 2. New state variables (after line 111, after targetEntities state)
```typescript
const [bidangList, setBidangList] = useState<Bidang[]>([]);
const [userBidangId, setUserBidangId] = useState<number | null>(null);
const [rolesList, setRolesList] = useState<Role[]>([]);
const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
```

### 3. Load bidang/permissions data on auth
In the auth state change effect (the one with `supabase.auth.onAuthStateChange`), after the existing profile fetch, add:

```typescript
// Fetch bidang, roles, permissions for RBAC
supabase.from('bidang').select('*').then(({ data }) => {
  if (data) setBidangList(data);
});
supabase.from('roles').select('*').then(({ data }) => {
  if (data) setRolesList(data);
});
supabase.from('permissions').select('*').then(({ data }) => {
  if (data) {
    setPermissionsList(data);
    const map = new Map<number, string>();
    data.forEach((p: Permission) => map.set(p.id, p.code));
    permissionChecker.setPermissionCodeMap(map);
  }
});
supabase.from('role_permissions').select('*').then(({ data }) => {
  if (data) permissionChecker.setRolePermissions(data as RolePermission[]);
});
```

### 4. Set user's bidang_id and role_id in permissionChecker
After getting profile data (where userRole is set), add:
```typescript
// Set permission checker
supabase.from('roles').select('id').eq('name', userRole).single().then(({ data }) => {
  if (data) {
    permissionChecker.setUser(data.id, profileData.bidang_id ?? null);
    if (profileData.bidang_id) setUserBidangId(profileData.bidang_id);
  }
});
```

### 5. Filter audits by bidang_id
In the `fetchAudits` function (where `supabase.from('audits').select('*')` is called), modify the query:

```typescript
const fetchAudits = () => {
  let query = supabase.from('audits').select('*');
  
  const scope = permissionChecker.getScope('audit.view');
  if (scope !== 'all' && userBidangId) {
    query = query.eq('bidang_id', userBidangId);
  }
  
  query.then(({ data, error }) => {
    // ... existing code ...
  });
};
```

### 6. Filter target_entities by bidang_id
In the auth effect where `target_entities` is fetched (line ~399):
```typescript
let entityQuery = supabase.from('target_entities').select('*');
const entityScope = permissionChecker.getScope('entity.view');
if (entityScope !== 'all' && userBidangId) {
  entityQuery = entityQuery.eq('bidang_id', userBidangId);
}
entityQuery.order('type').then(({ data, error }) => {
  if (!error && data) setTargetEntities(data as TargetEntity[]);
});
```

### 7. Include bidang_id in sync payload
In the debounced sync effect, add `bidang_id` to the audit upsert payload:
```typescript
const payload = validAudits.map(a => ({
  // ... existing fields ...
  bidang_id: userBidangId, // ADD THIS
}));
```

**Important:** The `fetchAudits` function call occurs inside a useEffect at mount time. The bidang filter depends on userBidangId being set, which happens inside the auth state change effect. Since the order of these effects is important, wrap the fetchAudits call so it only runs after userBidangId is available.

## Implementation steps:
1. Read current `src/App.tsx`
2. Apply each change above
3. Read `src/lib/permissions.ts` to understand permissionChecker API
4. Run `npm run lint` to verify
5. Commit: `git add src/App.tsx && git commit -m "feat: integrate permission system into App.tsx"`

## Report format
Write to `.superpowers/sdd/task-4-report.md`:
- What you implemented
- Files changed
- Test results (lint output)
- Self-review findings
- Any concerns

Then report back with Status, Commits, Test summary, Concerns, Report path.