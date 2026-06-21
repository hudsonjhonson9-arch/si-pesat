# Task 7: Role & Permission Admin UI

**Files:**
- Create: `src/components/RolePermissionView.tsx`
- Modify: `src/App.tsx` (add routing, nav link)

**Goal:** Build an admin interface to manage roles and their permissions, with ability to toggle permission on/off per role and change scope.

## Requirements

### Component: RolePermissionView

Props interface:
```typescript
interface RolePermissionViewProps {
  rolesList: Role[];
  permissionsList: Permission[];
  bidangList: Bidang[];
  onShowToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}
```

### Layout

Two-column layout:
- **Left panel (1/3):** Role list with "Tambah Role Baru" button
- **Right panel (2/3):** Permission editor for selected role

### A. Role List Panel
- Show all roles from `rolesList` prop
- Click on role → selects it and shows its permissions
- Selected role highlighted
- "Tambah Role Baru" button at top

### B. Permission Editor Panel
- Shows "Pilih role untuk mengatur permission" when no role selected
- When role is selected, shows a grid of permission toggle cards
- Each card has:
  - Permission label and code
  - Toggle switch (on/off)
  - Scope dropdown when enabled: `Bidang` / `Semua`
- "Simpan Perubahan" button at bottom
- Loads current permissions from Supabase `role_permissions` table for the selected role

### C. Add Role Modal
- Simple modal with input for role name
- On save: INSERT into `roles` table
- Refresh the roles list

### Implementation Details

**Loading current permissions:**
```typescript
useEffect(() => {
  if (!selectedRoleId) return;
  supabase.from('role_permissions')
    .select('*')
    .eq('role_id', selectedRoleId)
    .then(({ data }) => {
      if (!data) return;
      const permMap: Record<string, { enabled: boolean; scope: 'bidang' | 'all' }> = {};
      permissionsList.forEach(p => {
        const rp = data.find((r: any) => r.permission_id === p.id);
        permMap[p.code] = {
          enabled: !!rp,
          scope: rp?.scope || 'bidang',
        };
      });
      setLocalPerms(permMap);
    });
}, [selectedRoleId, permissionsList]);
```

**Saving permissions:**
```typescript
const handleSave = async () => {
  if (!selectedRoleId) return;
  // Delete existing
  await supabase.from('role_permissions').delete().eq('role_id', selectedRoleId);
  // Insert new
  const inserts = Object.entries(localPerms)
    .filter(([, v]) => v.enabled)
    .map(([code, v]) => {
      const perm = permissionsList.find(p => p.code === code);
      return perm ? { role_id: selectedRoleId, permission_id: perm.id, scope: v.scope } : null;
    })
    .filter(Boolean);
  if (inserts.length > 0) {
    const { error } = await supabase.from('role_permissions').insert(inserts);
    if (error) {
      onShowToast?.('Gagal menyimpan: ' + error.message, 'error');
      return;
    }
  }
  onShowToast?.('Permission berhasil disimpan.', 'success');
  // Re-fetch role_permissions to update permissionChecker
  supabase.from('role_permissions').select('*').then(({ data }) => {
    if (data) permissionChecker.setRolePermissions(data as RolePermission[]);
  });
};
```

**Adding role:**
```typescript
const handleAddRole = async () => {
  if (!newRoleName.trim()) return;
  const maxId = Math.max(...rolesList.map(r => r.id), 0);
  const { error } = await supabase.from('roles').insert({ id: maxId + 1, name: newRoleName.trim() });
  if (error) {
    onShowToast?.('Gagal menambah role: ' + error.message, 'error');
    return;
  }
  onShowToast?.('Role berhasil ditambahkan.', 'success');
  setShowAddRole(false);
  setNewRoleName('');
};
```

### App.tsx changes

**ActiveTab type** — add `'role-permission'`:
```typescript
const [activeTab, setActiveTab] = useState<'dashboard' | 'audits' | 'jenis-audit' | 'new-audit' | 'statistik' | 'profil' | 'pengguna' | 'role-permission'>('dashboard');
```

**Hash routes** — add `'role-permission'` to the array in handleHashChange.

**Import:**
```typescript
import RolePermissionView from './components/RolePermissionView';
```

**Nav button** — add in header nav (desktop) and mobile "Lainnya" sheet:
```typescript
{permissionChecker.can('role.manage') && (
  <button onClick={() => navigateTo('role-permission')}
    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-bold text-xs ${
      activeTab === 'role-permission'
        ? 'bg-peach-accent text-dark-gray shadow-sm border border-dark-gray/5'
        : 'text-dark-gray/70 hover:bg-white/40 hover:text-dark-gray'
    }`}>
    <Shield className="w-4 h-4" /> Role & Permission
  </button>
)}
```
Import `Shield` from lucide-react.

**renderContent** — add case:
```typescript
case 'role-permission':
  return <RolePermissionView rolesList={rolesList} permissionsList={permissionsList} bidangList={bidangList} onShowToast={showToast} />;
```

**Mobile nav "Lainnya" sheet** — add the same button there too.

## Style guidance
Follow the existing design patterns:
- Same card styles as other components (rounded-2xl, border, shadow-sm)
- Same button styles (font-black, rounded-xl)
- Same color scheme (dark-gray, peach-accent, baby-blue)
- Same font sizes (text-xs for labels, text-[10px] for metadata)

## Verification
1. Run `npm run lint` — must pass
2. Component should be navigable from nav bar

## Implementation
1. Create `RolePermissionView.tsx`
2. Update `App.tsx`
3. Commit all changes

## Report
Write to `.superpowers/sdd/task-7-report.md`.