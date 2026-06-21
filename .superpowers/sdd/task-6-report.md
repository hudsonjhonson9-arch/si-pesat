# Task 6 Report: Update User Management — Bidang & New Roles

**Status:** ✅ Complete

## Files Modified
- `src/components/UserManagementView.tsx` — Added bidang assignment, Sekretaris & PPPK roles, bidang sorting
- `src/App.tsx` — Passed `bidangList` prop, added `bidang_id` to profile select queries

## Changes Summary

### UserManagementView.tsx
- Imported `Bidang` type, added `bidangList: Bidang[]` to props
- Added 'Sekretaris' and 'PPPK' to `ROLE_OPTIONS` (now 15 roles)
- Reordered `ROLE_ORDER` with Sekretaris (1) and PPPK (14)
- Added Sekretaris (indigo) and PPPK (rose) entries to `ROLE_CONFIG`
- Added `editBidangId` state, initialized in `startEdit`, saved in `saveEdit`
- Added bidang dropdown in edit form (after pangkat)
- Added bidang badge in read-only row (after role badge)
- Updated sort to prioritize bidang_id, then role, then golongan

### App.tsx
- Passed `bidangList={bidangList}` to `UserManagementView`
- Added `bidang_id` to all three `profiles.select()` queries

## Lint
`npm run lint` — passed with no errors

## Commit
`6714794` — `feat: add bidang assignment and new roles to user management`
