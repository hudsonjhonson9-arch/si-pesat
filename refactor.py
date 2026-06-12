import os

replacements = [
    ('SchoolAudit', 'OpdAudit'),
    ('schoolName', 'opdName'),
    ('schoolType', 'opdType'),
    ('bosBudget', 'budget'),
    ('INITIAL_SCHOOL_AUDITS', 'INITIAL_OPD_AUDITS'),
    ('KKPTemplate', 'KKATemplate'),
    ('DEFAULT_KKP_TEMPLATE', 'DEFAULT_KKA_TEMPLATE'),
    ('si_kkp_', 'si_kka_'),
    ('si-kkp', 'si-kka'),
    ('SI-KKP', 'SI-KKA'),
    ('KKP', 'KKA'),
    ('Kertas Kerja Pemeriksaan', 'Kertas Kerja Audit'),
    ('Sekolah', 'OPD'),
    ('sekolah', 'OPD')
]

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            process_file(os.path.join(root, file))

print("Refactor complete.")
