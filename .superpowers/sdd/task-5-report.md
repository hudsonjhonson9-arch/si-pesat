# Task 5: Update Permission Checks Across Components

## Status: COMPLETE

## Summary
Replaced all hardcoded `userRole === 'X'` checks with `permissionChecker.can('code')` calls across components. Replaced hardcoded Irban IV branding with dynamic bidang name in HomeView.

## Files Modified

### App.tsx
- Replaced header nav role checks for "Jenis Audit" button: `permissionChecker.can('template.manage')`
- Replaced header nav role checks for "Pengguna" button: `permissionChecker.can('user.manage')`
- Replaced mobile footer grid column calculation based on permission counts
- Replaced mobile footer "Jenis Audit" button role check: `permissionChecker.can('template.manage')`
- Replaced mobile footer "Pengguna" button role check: `permissionChecker.can('user.manage')`
- Passed `bidangName` prop to HomeView

### HomeView.tsx
- Added `bidangName?: string` to HomeViewProps interface
- Added `import { permissionChecker } from '../lib/permissions'`
- Replaced notification banner role checks with `permissionChecker.can('audit.review')`
- Replaced hardcoded "SI-PESAT IRBAN IV" with dynamic `{bidangName}`
- Replaced "Inspektur Pembantu Wilayah IV" subtitle with dynamic `{bidangName}`
- Replaced "Penatausahaan KKA Irban IV." with dynamic `{bidangName}`

### AuditWorkspaceView.tsx
- Added `import { permissionChecker } from '../lib/permissions'`
- Replaced all `STRUKTURAL_ROLES.includes(userRole) || isAdmin` with `permissionChecker.can('audit.review')` (8 occurrences)
- Kept `KETUA_TIM_ROLES` and `FUNGSIONAL_ROLES` logic unchanged

### AuditListView.tsx
- Added `import { permissionChecker } from '../lib/permissions'`
- Removed `const STRUKTURAL_ROLES` constant
- Replaced delete button role check with `permissionChecker.can('audit.delete')`

### UserProfileView.tsx
- Added `import { permissionChecker } from '../lib/permissions'`
- Replaced Inspektur/Irban panel role check with `permissionChecker.can('audit.review')`

### Files Not Modified (no role checks found)
- TemplateConfiguratorView.tsx (no role checks, access controlled via App.tsx nav)
- StatistikView.tsx (no role checks, access controlled via App.tsx nav)
- NewAuditView.tsx (no role checks in component)

## Permission Code Mapping
| Old Check | New Permission Code |
|-----------|-------------------|
| `userRole === 'Inspektur' \|\| userRole === 'Inspektur Pembantu' \|\| isAdmin` | `permissionChecker.can('template.manage')` |
| `['Inspektur', 'Inspektur Pembantu'].includes(userRole)` | `permissionChecker.can('user.manage')` |
| `userRole === 'Inspektur Pembantu' \|\| userRole === 'Inspektur' \|\| isAdmin` | `permissionChecker.can('audit.review')` |
| `STRUKTURAL_ROLES.includes(userRole) \|\| isAdmin` | `permissionChecker.can('audit.review')` |
| `STRUKTURAL_ROLES.includes(userRole)` (for delete) | `permissionChecker.can('audit.delete')` |

## Verification
- `npm run lint` (tsc --noEmit) passes clean
