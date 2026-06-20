### Task 3: UserManagementView — New Roles + is_admin Toggle

**Files:**
- Modify: `src/components/UserManagementView.tsx`

**Interfaces:**
- Consumes: `isAdmin` prop from App.tsx (Task 2); `UserProfile` with `is_admin` from Task 1
- Produces: Updated user management with 13 roles and `is_admin` toggle

- [ ] **Step 1: Update ROLE_OPTIONS**

Change from 3 roles to all 13 roles:

```typescript
const ROLE_OPTIONS = [
  'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
  'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
  'Inspektur Pembantu', 'Inspektur'
] as const;
```

- [ ] **Step 2: Update ROLE_ORDER**

```typescript
const ROLE_ORDER: Record<string, number> = {
  'Inspektur': 0, 'Inspektur Pembantu': 1,
  'Auditor Ahli Utama': 2, 'Auditor Ahli Madya': 3, 'Auditor Ahli Muda': 4, 'Auditor Ahli Pertama': 5,
  'Auditor Penyelia': 6, 'Auditor Pelaksana Lanjutan': 7, 'Auditor Pelaksana': 8,
  'PPUPD Ahli Utama': 9, 'PPUPD Ahli Madya': 10, 'PPUPD Ahli Muda': 11, 'PPUPD Ahli Pertama': 12,
};
```

- [ ] **Step 3: Update ROLE_CONFIG**

Replace the old 3-entry config with all 13 roles. Group by type with icons/colors:

```typescript
const ROLE_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  'Auditor Pelaksana': { label: 'Pelaksana', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Auditor Pelaksana Lanjutan': { label: 'Pelaksana Lanjutan', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Auditor Penyelia': { label: 'Penyelia', icon: <UserIcon className="w-3.5 h-3.5" />, bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
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

Note: `Shield` is already imported from `lucide-react` at the top of the file.

- [ ] **Step 4: Update `canEdit`, `canEditRole`, `canToggleMfa`**

```typescript
const canEdit = currentUserRole === 'Inspektur' || currentUserRole === 'Inspektur Pembantu' || isAdmin;
const canEditRole = currentUserRole === 'Inspektur' || isAdmin;
const canToggleMfa = currentUserRole === 'Inspektur' || isAdmin;
```

- [ ] **Step 5: Add `is_admin` state + edit form toggle**

Add state variable after existing edit states:
```typescript
const [editIsAdmin, setEditIsAdmin] = useState(false);
```

Update `startEdit` function to include:
```typescript
setEditIsAdmin((profile as any).is_admin || false);
```

In `saveEdit`, add `is_admin: editIsAdmin` to the supabase update payload.

In the edit form JSX, add an is_admin toggle INSIDE the grid, after the MFA toggle. It should be wrapped with `{canEditRole && (` so only Inspektur or admin can toggle it:

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

Note: `ShieldCheck` is already imported from `lucide-react`.

- [ ] **Step 6: Verify**

Run: `npm run lint` — Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add src/components/UserManagementView.tsx
git commit -m "feat: expand role list to 13 roles, add is_admin toggle in user edit form"
```
