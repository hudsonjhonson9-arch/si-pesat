# Task 6: Update User Management — Bidang & New Roles

**Files:**
- Modify: `src/components/UserManagementView.tsx`
- Modify: `src/App.tsx` (pass bidangList to UserManagementView)

**Goal:** Add bidang assignment to user management, add Sekretaris & PPPK roles, sort/filter by bidang.

## Requirements

### A. Add new imports and types
```typescript
import { Bidang } from '../types';
```
Add `bidangList: Bidang[]` to the component props interface.

### B. Update ROLE_OPTIONS
Change to 15 roles:
```typescript
const ROLE_OPTIONS = [
  'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
  'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
  'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
  'Inspektur Pembantu', 'Inspektur', 'Sekretaris', 'PPPK'
] as const;
```

### C. Update ROLE_ORDER
Add Sekretaris and PPPK:
```typescript
'Sekretaris': 1.5, 'PPPK': 13,
```

### D. Update ROLE_CONFIG
Add config for Sekretaris and PPPK (use ShieldCheck icon, appropriate colors).

### E. Add bidang state to form
```typescript
const [editBidangId, setEditBidangId] = useState<number | null>(null);
```

### F. Add bidang dropdown to edit form
After the pangkat field, add:
```tsx
{/* Bidang */}
<div className="space-y-1">
  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bidang / Irban</label>
  <select value={editBidangId ?? ''} onChange={e => setEditBidangId(e.target.value ? Number(e.target.value) : null)}
    className="w-full text-xs font-bold border border-slate-200 p-2 rounded-lg bg-white text-slate-700 outline-none focus:ring-1 focus:ring-blue-400">
    <option value="">— Pilih Bidang —</option>
    {bidangList.map(b => <option key={b.id} value={b.id}>{b.name}{b.wilayah ? ` (${b.wilayah})` : ''}</option>)}
  </select>
</div>
```

### G. Initialize editBidangId in startEdit
```typescript
setEditBidangId((profile as any).bidang_id ?? null);
```

### H. Include bidang_id in saveEdit
```typescript
bidang_id: editBidangId,
```

### I. Show bidang badge in user row
In the read-only row, after the role badge, add:
```tsx
{profile.bidang_id && (
  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
    {bidangList.find(b => b.id === profile.bidang_id)?.name || '—'}
  </span>
)}
```

### J. Sort user list by bidang then role
In the filteredProfiles sort:
```typescript
.sort((a, b) => {
  const bidangDiff = (a.bidang_id ?? 99) - (b.bidang_id ?? 99);
  if (bidangDiff !== 0) return bidangDiff;
  const roleDiff = (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99);
  if (roleDiff !== 0) return roleDiff;
  // ... existing golongan and name sort
});
```

### K. Add bidang filter
After the role filter buttons, optionally add a bidang filter section.

### L. Update App.tsx
In renderContent for UserManagementView, pass:
```typescript
<UserManagementView
  // ... existing props
  bidangList={bidangList}
/>
```

## Implementation
1. Read current file
2. Apply all changes
3. Run `npm run lint`
4. Commit: `git add -A && git commit -m "feat: add bidang assignment and new roles to user management"`

## Report
Write to `.superpowers/sdd/task-6-report.md`.