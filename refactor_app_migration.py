import re

filepath = 'src/App.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update localStorage loading to auto-migrate invalid UUIDs
load_old = """    if (cachedAudits) {
      try {
        setAudits(JSON.parse(cachedAudits));
      } catch (e) {"""

load_new = """    if (cachedAudits) {
      try {
        let parsed = JSON.parse(cachedAudits);
        
        // Auto-migrate legacy string IDs to proper UUIDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        parsed = parsed.map((a: any) => {
          if (!uuidRegex.test(a.id)) {
            // Provide a real UUID fallback
            const fallbackUUID = typeof crypto !== 'undefined' && crypto.randomUUID 
              ? crypto.randomUUID() 
              : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                  const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
                  return v.toString(16);
                });
            return { ...a, id: fallbackUUID };
          }
          return a;
        });
        
        setAudits(parsed);
      } catch (e) {"""
content = content.replace(load_old, load_new)

# 2. Update handleSync error logging
sync_old = """            const { error } = await supabase.from('audits').upsert(payload, { onConflict: 'id' });
            if (error) console.error('Background sync audits failed:', error);
          }"""

sync_new = """            const { error } = await supabase.from('audits').upsert(payload, { onConflict: 'id' });
            if (error) {
              console.error('Background sync audits failed:', error);
              setSyncLogs(prev => [{
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                action: 'ERROR',
                details: `Gagal menyimpan KKA ke Database: ${error.message || JSON.stringify(error)}`
              }, ...prev].slice(0, 50));
            } else {
              setSyncLogs(prev => [{
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                action: 'UPLOAD',
                details: `Sinkronisasi KKA latar belakang berhasil.`
              }, ...prev].slice(0, 50));
            }
          }"""
content = content.replace(sync_old, sync_new)

# 3. Update template sync error logging
tsync_old = """          const { error: tError } = await supabase.from('templates').upsert(templatePayload, { onConflict: 'id' });
          if (tError) console.error('Background sync templates failed:', tError);"""

tsync_new = """          const { error: tError } = await supabase.from('templates').upsert(templatePayload, { onConflict: 'id' });
          if (tError) {
            console.error('Background sync templates failed:', tError);
            setSyncLogs(prev => [{
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              action: 'ERROR',
              details: `Gagal mensinkronkan Template ke Database: ${tError.message || JSON.stringify(tError)}`
            }, ...prev].slice(0, 50));
          }"""
content = content.replace(tsync_old, tsync_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
