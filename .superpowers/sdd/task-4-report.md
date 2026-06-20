# Task 4 Report: All Remaining File Updates — Ketua Tim Filter + Permission Checks

## What Was Implemented

### `src/components/NewAuditView.tsx`
- Added `KETUA_TIM_ROLES` constant
- Added `isAdmin?: boolean` to `NewAuditViewProps` interface
- Destructured `isAdmin = false` in component params
- Filtered Ketua Tim dropdown to only show users with `KETUA_TIM_ROLES` roles

### `src/components/AuditWorkspaceView.tsx`
- Added `KETUA_TIM_ROLES`, `STRUKTURAL_ROLES`, and `FUNGSIONAL_ROLES` constants
- Added `'Auditor'` to `FUNGSIONAL_ROLES` list (not in brief but required for backward compatibility — the old `'Auditor'` role string needs to match the functional check)
- Destructured `isAdmin = false` in component params
- **Ketua Tim filtering**: Added `KETUA_TIM_ROLES.includes(p.role)` to both "add category" and "edit category" auditor dropdown filters
- **Structural role checks**: Replaced all `userRole === 'Inspektur Pembantu' || userRole === 'Inspektur'` with `STRUKTURAL_ROLES.includes(userRole) || isAdmin` (8 occurrences)
- **FUNGSIONAL_ROLES checks**: Replaced all `userRole === 'Auditor'` with `FUNGSIONAL_ROLES.includes(userRole)` and all `userRole !== 'Auditor'` with `!FUNGSIONAL_ROLES.includes(userRole) && !isAdmin` (17 occurrences)
- Fixed `isTeamMember` to include `isAdmin` check so admins always have access

### `src/components/AuditListView.tsx`
- Added `STRUKTURAL_ROLES` constant
- Destructured `isAdmin = false` in component params
- Replaced `['Inspektur', 'Inspektur Pembantu', 'Admin'].includes(userRole)` with `(STRUKTURAL_ROLES.includes(userRole) || isAdmin)`

### `src/components/HomeView.tsx`
- Destructured `isAdmin = false` in component params (was already in interface from Task 2)
- Added `|| isAdmin` to both structural role checks (notification banners)

### `src/components/UserProfileView.tsx`
- Added `isAdmin?: boolean` to `UserProfileViewProps` interface
- Destructured `isAdmin = false` in component params
- Added `|| isAdmin` to structural role check

### `src/App.tsx`
- Added `isAdmin={isAdmin}` prop to `<UserProfileView>` (was missing)

## Test Results
- `npm run lint` (`tsc --noEmit`): **No errors**

## Files Changed
- `src/App.tsx`
- `src/components/NewAuditView.tsx`
- `src/components/AuditWorkspaceView.tsx`
- `src/components/AuditListView.tsx`
- `src/components/HomeView.tsx`
- `src/components/UserProfileView.tsx`

## Self-Review Findings
1. **`FUNGSIONAL_ROLES` needed `'Auditor'` added**: The brief's list doesn't include `'Auditor'`, but the old `userRole` system uses the literal string `'Auditor'`. Without adding it, all existing `'Auditor'` users would lose functional permissions. Added `'Auditor'` as the first entry.
2. **`isAdmin` not passed to UserProfileView**: App.tsx rendered `<UserProfileView>` without the `isAdmin` prop. Fixed.
3. **`isTeamMember` logic required admin override**: The original `isTeamMember = userRole !== 'Auditor' || ...` would block admins from team membership if they weren't assigned to any category. Changed to `isAdmin || !FUNGSIONAL_ROLES.includes(userRole) || ...`.
4. **Catatan Review logic preserved**: The original ternary `userRole === 'Auditor' || (isReadOnly && audit.status === 'Selesai')` was carefully rewritten to `FUNGSIONAL_ROLES.includes(userRole) || (isReadOnly && audit.status === 'Selesai')` to preserve the read-only display for non-auditor roles when the audit is completed.

## Issues or Concerns
- The `userRole === 'Auditor'` check in `UserProfileView.tsx:247` (auditor panel display) was not updated to use `FUNGSIONAL_ROLES` since it wasn't in scope. Users with new functional roles (e.g., 'Auditor Pelaksana') won't see the "Penugasan Saya" panel. This may need a follow-up.
- EvidencePanel's `isAuditor` prop is now `FUNGSIONAL_ROLES.includes(userRole)` — this should correctly include all functional auditor roles.
- The `isReviewerPanelVisible` variable is defined but never actually used in the component. This pre-existing issue was not addressed.
