import re

filepath = 'src/App.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove accessToken from handleUpdateAudit
content = re.sub(
    r'if \(user && accessToken && updatedAudit\.googleDriveFileId\) \{[^\}]+\}',
    r'// Auto sync to Drive in background is now handled by Supabase effect',
    content
)

# 2. Remove accessToken from handleDeleteAudit
content = re.sub(
    r'// If synced on Drive, attempt to delete there as well\s+if \(user && accessToken && auditToDelete\?\.googleDriveFileId\) \{[\s\S]*?\}',
    r'// Deletion from Drive is not supported in current central Web App yet',
    content
)

# 3. Replace syncSingleToDrive with a dummy
old_sync_single = """  // Push single Audit to Drive
  const syncSingleToDrive = async (audit: OpdAudit, silent = false) => {
    if (!accessToken) {
      showToast('Harap hubungkan akun Google Drive terlebih dahulu.', 'error');
      return;
    }

    if (!silent) setIsSyncing(true);
    try {
      addSyncLog('CREATE_FOLDER', `Menyiapkan folder struktur di Google Drive...`, audit.opdName);
      const docs = await syncAuditToDrive(accessToken, audit);
      
      // Update local storage with connection references
      setAudits(prev => prev.map(a => {
        if (a.id === audit.id) {
          return {
            ...a,
            googleDriveFolderId: docs.schoolFolderId,
            googleDriveFileId: docs.fileId,
            lastSyncedAt: new Date().toISOString()
          };
        }
        return a;
      }));

      addSyncLog('UPLOAD', `LHP KKA disinkronkan ke Drive folder: /${audit.opdName} (${audit.fiscalYear})`, audit.opdName);
      if (!silent) showToast(`KKA ${audit.opdName} berhasil disimpan ke Google Drive!`, 'success');
    } catch (err: any) {
      console.error(err);
      addSyncLog('ERROR', `Gagal menyinkronkan: ${err.message}`, audit.opdName);
      if (!silent) showToast(`Gagal mengunggah Drive: ${err.message}`, 'error');
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };"""

new_sync_single = """  // Push single Audit to Drive
  const syncSingleToDrive = async (audit: OpdAudit, silent = false) => {
    // Legacy function. Supabase handles sync automatically.
    if (!silent) showToast('Data disinkronkan otomatis melalui Supabase.', 'info');
  };"""

content = content.replace(old_sync_single, new_sync_single)

# 4. Replace batchSyncAllToDrive
old_batch = """  // batch sync all local audits to drive
  const batchSyncAllToDrive = async () => { /* TO DO */
    if (!accessToken) return;
    setIsSyncing(true);
    let successCount = 0;

    addSyncLog('UPLOAD', 'Memulai pencadangan massal KKA ke Google Drive...');
    
    for (const audit of audits) {
      try {
        await syncAuditToDrive(accessToken, audit);
        successCount++;
      } catch (err: any) {
        addSyncLog('ERROR', `Gagal migrasi massal ${audit.opdName}: ${err.message}`, audit.opdName);
      }
    }

    setIsSyncing(false);
    showToast(`Sinkronisasi Massal Selesai: ${successCount} dari ${audits.length} berkas berhasil diunggah.`, 'success');
  };"""

new_batch = """  // batch sync all local audits
  const batchSyncAllToDrive = async () => {
    showToast('Semua data sudah disinkronkan otomatis.', 'success');
  };"""

content = content.replace(old_batch, new_batch)

# 5. Replace fetchAllFromDrive
old_fetch = """  // pull from Drive
  const fetchAllFromDrive = async () => { /* TO DO */
    if (!accessToken) return;
    setIsSyncing(true);
    addSyncLog('DOWNLOAD', 'Membaca repositori pemeriksaan KKA di Google Drive...');
    
    try {
      const pulledAudits = await fetchAuditsFromDrive(accessToken);
      if (pulledAudits.length === 0) {
        showToast('Tidak ditemukan berkas KKA SI_KKA_Audit_OPD_Inspektorat di Google Drive Anda.', 'info');
        addSyncLog('DOWNLOAD', 'Pencarian selesai. Tidak ada berkas baru.');
      } else {
        // Merge or replace depending on what already exists
        setAudits(prev => {
          const merged = [...prev];
          pulledAudits.forEach(pulled => {
            const idx = merged.findIndex(a => a.opdName === pulled.opdName && a.fiscalYear === pulled.fiscalYear);
            if (idx >= 0) {
              merged[idx] = pulled; // Overwrite older physical records
            } else {
              merged.push(pulled);
            }
          });
          return merged;
        });
        showToast(`Impor Berhasil: ${pulledAudits.length} KKA ditarik dari Google Drive!`, 'success');
        addSyncLog('DOWNLOAD', `Berhasil memuat ${pulledAudits.length} lembar kkk dari Drive cloud.`);
      }
    } catch (err: any) {
      showToast(`Tarikan gagal: ${err.message}`, 'error');
      addSyncLog('ERROR', `Gagal menarik: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };"""

new_fetch = """  // pull from Drive
  const fetchAllFromDrive = async () => {
    showToast('Data ditarik otomatis saat login awal.', 'info');
  };"""

content = content.replace(old_fetch, new_fetch)

# 6. Remove accessToken prop from AuditWorkspaceView and SyncManagerView calls
content = re.sub(r'accessToken=\{.*?\}', '', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

# Update AuditWorkspaceView definition
filepath_workspace = 'src/components/AuditWorkspaceView.tsx'
with open(filepath_workspace, 'r', encoding='utf-8') as f:
    workspace_content = f.read()

workspace_content = re.sub(r'accessToken: string \| null;\s*', '', workspace_content)

with open(filepath_workspace, 'w', encoding='utf-8') as f:
    f.write(workspace_content)

# Update SyncManagerView definition
filepath_sync = 'src/components/SyncManagerView.tsx'
with open(filepath_sync, 'r', encoding='utf-8') as f:
    sync_content = f.read()

sync_content = re.sub(r'accessToken: string \| null;\s*', '', sync_content)

with open(filepath_sync, 'w', encoding='utf-8') as f:
    f.write(sync_content)

print("Removed accessToken logic")
