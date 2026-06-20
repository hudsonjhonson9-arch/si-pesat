# Golongan Sorting Implementation Plan

**Goal:**
Sort user list in `UserManagementView.tsx` primarily by `role` (already implemented) and secondarily by `golongan` rank, instead of just alphabetical by name.

**Architecture:**
1. Define a constant `GOLONGAN_ORDER` mapping that assigns a numerical value to each Indonesian civil servant `golongan` (e.g., 'IV/e' -> 0, 'IV/d' -> 1, ..., 'I/a' -> 16).
2. Update the `useMemo` in `UserManagementView.tsx` to include `golongan` in the sorting comparator function.

**Tech Stack:**
React, TypeScript (Project uses `golongan` as a string in `types.ts` and `profiles` table).

---

### Task 1: Create Golongan Mapping

**Files:**
- Create/Modify: `src/components/UserManagementView.tsx`

**Steps:**
1. Define `GOLONGAN_ORDER` constant before the `ROLE_ORDER` object.
2. Update `.sort()` comparator inside `filteredProfiles` `useMemo`.

---
