### Task 1: Database Migration + TypeScript Types

**Files:**
- Modify: `supabase_schema.sql`
- Modify: `src/types.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `UserProfile` with `is_admin` field; DB with new roles + `is_admin` column

- [ ] **Step 1: Update `supabase_schema.sql`**

Add `is_admin` column and update role CHECK constraint:

```sql
ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles DROP CONSTRAINT profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
    'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
    'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
    'Inspektur Pembantu', 'Inspektur'
  ));
```

Also update the CREATE TABLE statement in the same file to include `is_admin BOOLEAN DEFAULT false` in the `profiles` table definition.

- [ ] **Step 2: Update `src/types.ts`**

Add `is_admin` to `UserProfile`:

```typescript
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  nip?: string;
  golongan?: string;
  pangkat?: string;
  is_admin?: boolean;
}
```

- [ ] **Step 3: Verify**

Run: `npm run lint` — Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add supabase_schema.sql src/types.ts
git commit -m "feat: add is_admin column and expand role CHECK constraint to 13 roles"
```
