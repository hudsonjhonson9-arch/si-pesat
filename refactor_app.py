import re

filepath = 'src/App.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { INITIAL_OPD_AUDITS, DEFAULT_KKA_TEMPLATE } from './data';",
    "import { EMPTY_KKA_TEMPLATE } from './data';"
)

# 2. Update useState
content = content.replace(
    "const [template, setTemplate] = useState<KKATemplate>(DEFAULT_KKA_TEMPLATE);",
    "const [template, setTemplate] = useState<KKATemplate>(EMPTY_KKA_TEMPLATE);"
)

# 3. Update all DEFAULT_KKA_TEMPLATE to EMPTY_KKA_TEMPLATE
content = content.replace('DEFAULT_KKA_TEMPLATE', 'EMPTY_KKA_TEMPLATE')

# 4. Add teamMembers mapping in fetch
content = content.replace(
    "progress: d.progress,",
    "progress: d.progress,\n            teamMembers: d.team_members || [],"
)

# 5. Add teamMembers mapping in handleSync
content = content.replace(
    "progress: calculateProgress(a),",
    "progress: calculateProgress(a),\n            team_members: a.teamMembers || [],"
)

# 6. Update handleCreateAudit params
content = re.sub(
    r"const handleCreateAudit = \(\s*opdName: string,\s*opdType: OpdAudit\['opdType'\],\s*fiscalYear: string,\s*auditorName: string,\s*budget: number\s*\) => {",
    "const handleCreateAudit = (\n    opdName: string, \n    opdType: OpdAudit['opdType'], \n    fiscalYear: string, \n    auditorName: string, \n    budget: number,\n    teamMembers: string[]\n  ) => {",
    content
)

# 7. Add teamMembers to newAudit
content = content.replace(
    "progress: 0,\n      categories: initialCategories\n    };",
    "progress: 0,\n      categories: initialCategories,\n      teamMembers\n    };"
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
