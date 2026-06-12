import re

filepath = 'src/App.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace INITIAL_OPD_AUDITS with empty arrays for init
content = content.replace('setAudits(INITIAL_OPD_AUDITS);', 'setAudits([]);')

# Insert fetch logic right before closing bracket of the first useEffect
fetch_logic = """
    // Try to fetch real data from Supabase to overwrite local cache if online
    if (navigator.onLine) {
      supabase.from('audits').select('*').then(({ data, error }) => {
        if (!error && data) {
          const mapped = data.map(d => ({
            id: d.id,
            opdName: d.opd_name,
            opdType: d.opd_type,
            fiscalYear: d.fiscal_year,
            auditorName: d.auditor_name,
            auditDate: d.audit_date,
            budget: d.budget,
            status: d.status,
            progress: d.progress,
            categories: d.categories || []
          }));
          if (mapped.length > 0 || !cachedAudits) {
             setAudits(mapped);
          }
        }
      });
    }
  }, []);"""

content = re.sub(r'    \}\n  \}, \[\]\);', fetch_logic, content, count=1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed init logic")
