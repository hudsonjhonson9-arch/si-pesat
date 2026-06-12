import re

filepath = 'src/components/AuditWorkspaceView.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state
content = content.replace(
    "const [metaFiscalYear, setMetaFiscalYear] = useState(audit.fiscalYear);",
    "const [metaFiscalYear, setMetaFiscalYear] = useState(audit.fiscalYear);\n  const [metaTeamMembers, setMetaTeamMembers] = useState(audit.teamMembers?.join(', ') || '');"
)

# 2. Update handleSaveMetadata
content = content.replace(
    "fiscalYear: metaFiscalYear\n    });",
    "fiscalYear: metaFiscalYear,\n      teamMembers: metaTeamMembers.split(',').map(s => s.trim()).filter(Boolean)\n    });"
)

# 3. Update Profil Auditi Display
profil_old = """                  <div className="flex justify-between">
                    <span className="text-dark-gray/60 font-bold">Ketua Pemeriksa:</span>
                    <span className="font-extrabold text-dark-gray truncate max-w-[150px]">{audit.auditorName}</span>
                  </div>"""

profil_new = """                  <div className="flex justify-between">
                    <span className="text-dark-gray/60 font-bold">Ketua Pemeriksa:</span>
                    <span className="font-extrabold text-dark-gray truncate max-w-[150px]">{audit.auditorName}</span>
                  </div>
                  {audit.teamMembers && audit.teamMembers.length > 0 && (
                    <div className="flex flex-col">
                      <span className="text-dark-gray/60 font-bold">Anggota Tim:</span>
                      <span className="font-extrabold text-dark-gray">{audit.teamMembers.join(', ')}</span>
                    </div>
                  )}"""
content = content.replace(profil_old, profil_new)

# 4. Update Edit form
edit_old = """                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Nama Auditor Utama</label>
                  <input
                    type="text"
                    value={metaAuditorName}
                    onChange={e => setMetaAuditorName(e.target.value)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-1.5 rounded bg-white/70 text-dark-gray"
                  />
                </div>"""

edit_new = """                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Nama Auditor Utama</label>
                  <input
                    type="text"
                    value={metaAuditorName}
                    onChange={e => setMetaAuditorName(e.target.value)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-1.5 rounded bg-white/70 text-dark-gray"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-dark-gray/70 uppercase">Anggota Tim (Koma)</label>
                  <input
                    type="text"
                    value={metaTeamMembers}
                    onChange={e => setMetaTeamMembers(e.target.value)}
                    className="w-full text-xs font-bold border border-dark-gray/15 p-1.5 rounded bg-white/70 text-dark-gray"
                  />
                </div>"""
content = content.replace(edit_old, edit_new)


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
