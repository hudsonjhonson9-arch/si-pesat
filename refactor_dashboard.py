import os

# 1. Update AuditListView.tsx
filepath = 'src/components/AuditListView.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the status badge row with status + progress
old_row = """                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    audit.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                    audit.status === 'Sedang Berjalan' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    audit.status === 'Direview' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    {audit.status}
                  </span>
                </div>"""

new_row = """                <div className="flex items-center gap-2 mt-1 w-full max-w-[200px]">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    audit.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                    audit.status === 'Sedang Berjalan' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    audit.status === 'Direview' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    {audit.status}
                  </span>
                  
                  {/* Progress Bar */}
                  <div className="flex-1 h-2 bg-dark-gray/10 rounded-full overflow-hidden ml-2 flex items-center">
                    <div 
                      className="h-full bg-peach-accent transition-all duration-500 ease-out"
                      style={{ width: `${audit.progress || 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-dark-gray/60">{audit.progress || 0}%</span>
                </div>"""

content = content.replace(old_row, new_row)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)


# 2. Update DashboardView.tsx
filepath = 'src/components/DashboardView.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the specific audit card in Recent Activity to show progress
old_dash_row = """                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          audit.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          audit.status === 'Sedang Berjalan' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          audit.status === 'Direview' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                          {audit.status}
                        </span>
                      </div>"""

new_dash_row = """                      <div className="flex items-center gap-2 mt-1 max-w-[200px]">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          audit.status === 'Draft' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          audit.status === 'Sedang Berjalan' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          audit.status === 'Direview' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                          {audit.status}
                        </span>
                        
                        <div className="flex-1 h-1.5 bg-dark-gray/10 rounded-full overflow-hidden ml-2 flex items-center">
                          <div 
                            className="h-full bg-peach-accent transition-all duration-500 ease-out"
                            style={{ width: `${audit.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-dark-gray/60">{audit.progress || 0}%</span>
                      </div>"""

content = content.replace(old_dash_row, new_dash_row)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Progress bars added to views.")
