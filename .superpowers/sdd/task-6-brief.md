### Task 6: Clean Up Legacy Props

**Files:**
- Modify: `src/components/AuditWorkspaceView.tsx`

**Context:** With Task 4, EvidencePanel now reads from `evidenceFiles[]` instead of separate `evidenceLink`/`evidenceName` props. But the EvidencePanel usage in AuditWorkspaceView still passes the old props alongside the new ones. This task cleans that up.

**Steps:**

1. In `<EvidencePanel` usage (≈ line 609 area), remove `evidenceLink={item.evidenceLink} evidenceName={item.evidenceName}` since `evidenceFiles={item.evidenceFiles}` now covers both.

2. Update the `onChangeLink` handler so it updates `evidenceFiles[0].link` instead of the legacy `evidenceLink` field. Similarly for `onChangeName`:

```typescript
onChangeLink={(link) => handleFindingDetailChange(item.id, 'evidenceLink', link)}
onChangeName={(name) => {
  const files = item.evidenceFiles ? [...item.evidenceFiles] : [];
  if (files.length > 0) {
    files[0] = { ...files[0], name };
    handleFindingDetailsUpdate(item.id, { evidenceFiles: files, evidenceName: name });
  } else {
    handleFindingDetailChange(item.id, 'evidenceName', name);
  }
}}
```

Wait — actually the simplest change: keep `onChangeLink` and `onChangeName` as they are. They update the legacy fields for backward compat, and EvidencePanel still reads `evidenceFiles[0]` for display. The auto-migration in Task 1 handles bridging.

**Simplest change:**

Just remove `evidenceLink={item.evidenceLink} evidenceName={item.evidenceName}` from the `<EvidencePanel` JSX props. The component already has `evidenceFiles={item.evidenceFiles}` and reads from that.

3. Run: `cmd /c "cd /d D:\Code\si-pesat && npm run lint"`

4. Commit: `git add src/components/AuditWorkspaceView.tsx && git commit -m "refactor: remove legacy evidenceLink/evidenceName props from EvidencePanel"`
