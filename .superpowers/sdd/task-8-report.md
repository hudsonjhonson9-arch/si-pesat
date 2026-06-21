# Task 8: Update README.md

## Status: ✅ Complete

## Changes applied
1. **Header description** — Updated subtitle to `multi-bidang (Irban I—V)`
2. **Database Schema** — Added `bidang`, `roles`, `permissions`, `role_permissions` tables after `target_entities`
3. **Peran & Hak Akses** — Replaced old access matrix with 15-role table and dynamic permission description
4. **Project Structure** — Added `permissions.ts`, `googleDrive.ts`, `RolePermissionView.tsx` to tree
5. **Multi-Bidang Migration** — Added new section after Supabase setup referencing `20260621_multi_bidang_rbac.sql`
6. **Irban IV references** — Removed all single-Irban references; made generic for Inspektorat Kabupaten Sumba Barat

## Verification
- `npm run lint` (tsc --noEmit) — passed
- Commit: `db9f22b` — `docs: update README for multi-bidang and RBAC`
