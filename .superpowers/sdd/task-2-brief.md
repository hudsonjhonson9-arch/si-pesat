# Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types.ts`

**Goal:** Add new TypeScript interfaces for Bidang, Role, Permission, RolePermission. Add `bidang_id` field to existing interfaces (UserProfile, OpdAudit, TargetEntity, KKATemplate).

## Requirements

1. Add these interfaces to `src/types.ts`:
```typescript
export interface Bidang {
  id: number;
  name: string;
  wilayah?: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface Permission {
  id: number;
  code: string;
  label: string;
}

export interface RolePermission {
  role_id: number;
  permission_id: number;
  scope: 'bidang' | 'all';
}
```

2. Add `bidang_id?: number` to these existing interfaces:
- `UserProfile`
- `OpdAudit`
- `TargetEntity`
- `KKATemplate`

## Current state of src/types.ts

Read the current file first, then add the new interfaces and fields. The file currently exports:
- AuditStatus, AuditType, FindingStatus
- UserProfile
- AuditItem, AuditCategory, AuditMilestone
- OpdAudit
- TemplateItem, TemplateCategory, KKATemplate
- SyncLog, TargetEntity

## Verification

After making changes, verify `npm run lint` passes (tsc --noEmit).
