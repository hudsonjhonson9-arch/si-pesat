# Task 5: Update Permission Checks Across Components

**Files:**
- Modify: `src/App.tsx` (nav bars)
- Modify: `src/components/HomeView.tsx` (replace Irban IV branding, role checks)
- Modify: `src/components/AuditListView.tsx`
- Modify: `src/components/AuditWorkspaceView.tsx`
- Modify: `src/components/TemplateConfiguratorView.tsx`
- Modify: `src/components/StatistikView.tsx`
- Modify: `src/components/NewAuditView.tsx`
- Modify: `src/components/UserProfileView.tsx`

**Goal:** Replace hardcoded role string checks with `permissionChecker.can()` calls. Replace hardcoded Irban IV branding with dynamic bidang name.

## Changes

### A. App.tsx — Navigation role checks

Replace these hardcoded checks in header nav (lines 812-835):
- `{userRole === 'Inspektur' || userRole === 'Inspektur Pembantu' || isAdmin` with `{permissionChecker.can('template.manage')`
- `{userRole === 'Inspektur' || userRole === 'Inspektur Pembantu' || isAdmin` (pengguna) with `{permissionChecker.can('user.manage')`

Same in mobile nav footer (lines 917-938).

### B. HomeView.tsx — Dynamic branding

Replace hardcoded Irban IV text:
- `"SI-PESAT IRBAN IV"` → accept `bidangName` prop and display dynamically
- `"Inspektur Pembantu Wilayah IV"` → dynamic
- `"Penatausahaan KKA Irban IV."` → dynamic

Add `bidangName?: string` to HomeViewProps interface.

In App.tsx's renderContent for HomeView, pass:
```typescript
bidangName={bidangList.find(b => b.id === userBidangId)?.name || 'IRBAN'}
```

### C. AuditWorkspaceView.tsx — Replace role checks

Find and replace:
- `userRole === 'Inspektur' || userRole === 'Inspektur Pembantu'` → `permissionChecker.can('audit.review')`
- `userRole === 'Inspektur'` (for approve) → `permissionChecker.can('audit.approve')`
- Any `KETUA_TIM_ROLES.includes(userRole)` → keep for now (will be handled in separate work)
- Any `STRUKTURAL_ROLES.includes(userRole)` → `permissionChecker.can('audit.review')`

Since components receive `userRole` as prop, change them to import `permissionChecker` directly from `../lib/permissions`.

### D. AuditListView.tsx

Replace add/delete visibility checks with:
- `can('audit.create')` for create button
- `can('audit.delete')` for delete button
- Import `permissionChecker` from `../lib/permissions`

### E. TemplateConfiguratorView.tsx

Replace any userRole/isAdmin checks with `permissionChecker.can('template.manage')`

### F. StatistikView.tsx

Replace any userRole checks with `permissionChecker.can('stats.view')`

### G. NewAuditView.tsx

Replace any userRole checks with permission-based checks.

### H. UserProfileView.tsx

Replace any role checks with permission checks.

## Implementation steps for each file:
1. Add import: `import { permissionChecker } from '../lib/permissions';`
2. Find `userRole === 'X'` or `isAdmin` checks
3. Replace with `permissionChecker.can('code')`
4. Run `npm run lint` after all files are modified
5. Commit all changes together

## Key mapping rules:
| Old check | New check |
|-----------|-----------|
| `userRole === 'Inspektur' \|\| userRole === 'Inspektur Pembantu' \|\| isAdmin` | `permissionChecker.can('template.manage')` or `permissionChecker.can('user.manage')` |
| `userRole === 'Inspektur' \|\| userRole === 'Inspektur Pembantu'` | `permissionChecker.can('audit.review')` |
| `userRole === 'Inspektur'` | `permissionChecker.can('audit.approve')` |
| `['Inspektur', 'Inspektur Pembantu'].includes(userRole)` | `permissionChecker.can('audit.review')` |
| `isAdmin` check for edit/delete | `permissionChecker.can('audit.edit')` or `permissionChecker.can('audit.delete')` |

## Report
Write to `.superpowers/sdd/task-5-report.md`.

Commit: `git add -A && git commit -m "feat: replace hardcoded role checks with permissionChecker"`