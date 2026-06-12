import os
import re

filepath = 'src/App.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add progress calculation helper
progress_helper = """
  // Calculate Progress Helper
  const calculateProgress = (audit: OpdAudit): number => {
    let totalItems = 0;
    let evaluatedItems = 0;
    audit.categories.forEach(cat => {
      cat.items.forEach(item => {
        totalItems++;
        // Asumsi: Jika ada uraian temuan, atau statusnya bukan Sesuai (karena default Sesuai), atau ada nilai temuan, berarti sudah dievaluasi.
        // Jika kita ingin lebih presisi, kita bisa tambahkan status 'Draft' di item, tapi untuk sekarang kita anggap dievaluasi jika ada perubahan
        if (item.status === 'Temuan' || item.status === 'N/A' || item.uraianTemuan.length > 0 || item.nilaiTemuan > 0) {
          evaluatedItems++;
        }
      });
    });
    // If we want simple progress based on status, we can just say if it's reviewed.
    // For now, let's just use a dummy logic or check if status is Selesai
    if (audit.status === 'Selesai') return 100;
    if (totalItems === 0) return 0;
    
    // Instead of strict evaluation, we can track audit status: 
    // Draft = 10%, Sedang Berjalan = 50%, Direview = 80%, Selesai = 100%
    if (audit.status === 'Draft') return 10;
    if (audit.status === 'Sedang Berjalan') return 50;
    if (audit.status === 'Direview') return 80;
    
    return Math.round((evaluatedItems / totalItems) * 100);
  };
"""

# Insert progress_helper before handleCreateAudit
content = content.replace("  // Audit Crud Actions", progress_helper + "\n  // Audit Crud Actions")

# 2. Update handleCreateAudit to set progress
content = content.replace("status: 'Draft',", "status: 'Draft',\n      progress: 0,")

# 3. Add Supabase Sync Logic using debounce
sync_logic = """
  // Supabase Background Sync (Debounced)
  useEffect(() => {
    const handleSync = async () => {
      if (!navigator.onLine || audits.length === 0) return;
      
      try {
        const payload = audits.map(a => ({
          id: a.id,
          opd_name: a.opdName,
          opd_type: a.opdType,
          fiscal_year: a.fiscalYear,
          auditor_name: a.auditorName,
          audit_date: a.auditDate,
          budget: a.budget,
          status: a.status,
          progress: calculateProgress(a),
          categories: a.categories,
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase.from('audits').upsert(payload, { onConflict: 'id' });
        if (error) {
          console.error('Background sync failed:', error);
        } else {
          console.log('Background sync to Supabase successful.');
        }
      } catch (err) {
        console.error('Background sync error:', err);
      }
    };

    const timer = setTimeout(() => {
      handleSync();
    }, 5000); // Debounce 5 seconds

    return () => clearTimeout(timer);
  }, [audits]);
"""

# Insert sync logic after the initial useEffects
content = content.replace("  // 3. Setup Supabase Auth state listener", sync_logic + "\n  // 3. Setup Supabase Auth state listener")

# 4. Update handleUpdateAudit to update progress
old_update = """  const handleUpdateAudit = (updatedAudit: OpdAudit) => {
    setAudits(prev => prev.map(a => a.id === updatedAudit.id ? updatedAudit : a));
    
    // Auto sync to Drive in background if it has already been synced once
    if (user && accessToken && updatedAudit.googleDriveFileId) {
      addSyncLog('UPLOAD', 'Pembaruan disimpan lokal. Sync otomatis akan berjalan.')
    }
  };"""

new_update = """  const handleUpdateAudit = (updatedAudit: OpdAudit) => {
    const withProgress = { ...updatedAudit, progress: calculateProgress(updatedAudit) };
    setAudits(prev => prev.map(a => a.id === updatedAudit.id ? withProgress : a));
  };"""

content = content.replace(old_update, new_update)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added Supabase offline sync and progress to App.tsx")
