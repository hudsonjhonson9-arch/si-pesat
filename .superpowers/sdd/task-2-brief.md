### Task 2: Google Apps Script — subPath Support

**Files:**
- Modify: `google-apps-script.gs`

**Interfaces:**
- Produces: backend accepts optional `subPath` parameter for nested folder creation

**Context:** Currently, files are stored in `ROOT / TA {year} / {OPD} / {auditType}`. For folder upload, we need to also create subfolders within that structure to preserve the uploaded folder's hierarchy.

**Steps:**

1. In `google-apps-script.gs`, after the existing folder creation block (after `if (payload.auditType)` block, around line 157-158, right before `var file;`), add:

```javascript
// subPath for nested folder structure from browser folder upload
if (payload.subPath) {
  var pathParts = payload.subPath.split('/').filter(function(p) { return p.trim() !== ''; });
  for (var i = 0; i < pathParts.length; i++) {
    currentFolder = getOrCreateFolder(currentFolder, pathParts[i]);
  }
}
```

This uses the existing `getOrCreateFolder` function (defined at line 131) which handles folder naming safely with sanitization.

2. Commit: `git add google-apps-script.gs && git commit -m "feat: add subPath param for nested folder upload"`
