### Task 5: Progress & Stats Consistency

**Files:**
- Modify: `src/App.tsx` — `calculateProgress` function
- Modify: `src/components/UserProfileView.tsx` — evidence count check

**Steps:**

1. In `src/App.tsx`, update `calculateProgress` (≈ line 728-741). Currently it checks `item.evidenceLink && item.evidenceLink.trim() !== ''`. Change to:

```typescript
const calculateProgress = (audit: OpdAudit): number => {
  if (audit.status === 'Selesai') return 100;
  let totalItems = 0;
  let uploadedItems = 0;
  audit.categories.forEach(cat => {
    cat.items.forEach(item => {
      totalItems++;
      if (item.evidenceFiles && item.evidenceFiles.length > 0) uploadedItems++;
    });
  });
  if (totalItems === 0) return 0;
  return Math.round((uploadedItems / totalItems) * 100);
};
```

2. In `src/components/UserProfileView.tsx`, find the line that checks evidence (≈ line 68):
```typescript
if (item.evidenceFiles && item.evidenceFiles.length > 0) uploaded++;
```

3. Run: `cmd /c "cd /d D:\Code\si-pesat && npm run lint"`

4. Commit: `git add src/App.tsx src/components/UserProfileView.tsx && git commit -m "fix: update progress calc to use evidenceFiles array"`
