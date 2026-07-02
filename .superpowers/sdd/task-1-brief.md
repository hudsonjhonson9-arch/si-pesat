### Task 1: Data Model & Auto-Migration

**Files:**
- Modify: `src/types.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `EvidenceFile` interface, updated `AuditItem` with `evidenceFiles?: EvidenceFile[]`
- Produces: auto-migration logic in App.tsx load effect

**Steps:**

1. Add `EvidenceFile` interface to `src/types.ts` (after `FindingStatus`, before `AuditItem`):
```typescript
export interface EvidenceFile {
  id: string;
  name: string;
  link: string;
  relativePath: string;
  uploadedAt: string;
  uploadedBy: string;
  size: number;
}
```

2. Update `AuditItem` — add `evidenceFiles?: EvidenceFile[]` after `evidenceName`.

3. Add auto-migration in `App.tsx`:
   - In the localStorage load effect (≈line 248-275), after parsing audits, map each item to auto-create `evidenceFiles` from `evidenceLink` + `evidenceName` if `evidenceFiles` is missing.
   - Same migration in the Supabase fetch handler (≈line 216-231).
   - Migration code:
```typescript
if (item.evidenceLink && !item.evidenceFiles) {
  return {
    ...item,
    evidenceFiles: [{
      id: crypto.randomUUID?.() || `ev_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      name: item.evidenceName || 'Dokumen Bukti',
      link: item.evidenceLink,
      relativePath: item.evidenceName || 'Dokumen Bukti',
      uploadedAt: new Date().toISOString(),
      uploadedBy: a.auditorName || 'Unknown',
      size: 0
    }]
  };
}
return item;
```
