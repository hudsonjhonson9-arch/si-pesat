import re

filepath = 'src/components/AuditListView.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Props type
content = content.replace(
    "budget: number\n  ) => void;",
    "budget: number,\n    teamMembers: string[]\n  ) => void;"
)

# 2. Add state
content = content.replace(
    "const [newBosBudget, setNewBosBudget] = useState('150000000');",
    "const [newBosBudget, setNewBosBudget] = useState('150000000');\n  const [newTeamMembers, setNewTeamMembers] = useState('');"
)

# 3. Update handleSubmitNewAudit
content = content.replace(
    "parseFloat(newBosBudget) || 0\n    );",
    "parseFloat(newBosBudget) || 0,\n      newTeamMembers.split(',').map(s => s.trim()).filter(Boolean)\n    );"
)

# 4. Clear state in handleSubmit
content = content.replace(
    "setNewAuditorName('');",
    "setNewAuditorName('');\n    setNewTeamMembers('');"
)

# 5. Update Card View
card_old = """                  {/* Auditor in charge info */}
                  <div className="flex items-center gap-1.5 text-xs text-dark-gray/80 bg-white/40 px-2.5 py-1.5 rounded-lg border border-dark-gray/5 truncate">
                    <User className="w-3.5 h-3.5 text-dark-gray/50 flex-shrink-0" />
                    <span className="truncate">Auditor: {audit.auditorName || 'Belum Ditugaskan'}</span>
                  </div>"""

card_new = """                  {/* Auditor in charge info */}
                  <div className="flex flex-col gap-1.5 text-xs text-dark-gray/80 bg-white/40 px-2.5 py-1.5 rounded-lg border border-dark-gray/5">
                    <div className="flex items-center gap-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-dark-gray/50 flex-shrink-0" />
                      <span className="truncate font-bold">Ketua Tim: {audit.auditorName || 'Belum Ditugaskan'}</span>
                    </div>
                    {audit.teamMembers && audit.teamMembers.length > 0 && (
                      <div className="flex items-start gap-1.5 text-[10px] text-dark-gray/60 pl-5">
                        <span className="truncate">Anggota: {audit.teamMembers.join(', ')}</span>
                      </div>
                    )}
                  </div>"""
content = content.replace(card_old, card_new)

# 6. Add input for Team Members
input_old = """              {/* Action buttons */}"""
input_new = """              {/* Anggota Tim */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-dark-gray/70 uppercase tracking-wider block">Anggota Tim (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  placeholder="Misal: Budi, Cici, Dedi"
                  value={newTeamMembers}
                  onChange={e => setNewTeamMembers(e.target.value)}
                  className="w-full text-xs font-bold border border-dark-gray/15 p-2 rounded-lg bg-white/70 hover:bg-white focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-peach-accent/30 focus:border-peach-accent text-dark-gray"
                />
              </div>

              {/* Action buttons */}"""
content = content.replace(input_old, input_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
