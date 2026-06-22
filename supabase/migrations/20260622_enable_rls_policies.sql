-- Aktifkan RLS dan buat policies untuk keamanan data SI-PESAT

-- 1. Helper function untuk cek admin (gunakan SECURITY DEFINER biar bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

-- 2. Helper function untuk cek role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$;

-- ==================== PROFILES ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profil_baca_sendiri" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "profil_update_sendiri" ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

CREATE POLICY "profil_hanya_admin" ON profiles
  FOR DELETE USING (is_admin());

-- Insert tetap via trigger (handle_new_user), izinkan admin insert manual
CREATE POLICY "profil_admin_insert" ON profiles
  FOR INSERT WITH CHECK (is_admin());

-- ==================== AUDITS ====================
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_baca" ON audits
  FOR SELECT USING (
    is_admin()
    OR created_by = auth.uid()
    OR auth.uid() IN (
      SELECT id FROM profiles
      WHERE full_name IN (
        SELECT jsonb_array_elements_text(team_members)
      )
    )
  );

CREATE POLICY "audit_buat" ON audits
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    OR is_admin()
  );

CREATE POLICY "audit_update" ON audits
  FOR UPDATE USING (
    is_admin()
    OR created_by = auth.uid()
  );

CREATE POLICY "audit_hapus" ON audits
  FOR DELETE USING (
    is_admin()
    OR created_by = auth.uid()
  );

-- ==================== TEMPLATES ====================
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_baca" ON templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "template_admin_tulis" ON templates
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "template_admin_update" ON templates
  FOR UPDATE USING (is_admin());

CREATE POLICY "template_admin_hapus" ON templates
  FOR DELETE USING (is_admin());

-- ==================== TARGET ENTITIES ====================
ALTER TABLE target_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "target_baca" ON target_entities
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "target_admin_tulis" ON target_entities
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "target_admin_update" ON target_entities
  FOR UPDATE USING (is_admin());

CREATE POLICY "target_admin_hapus" ON target_entities
  FOR DELETE USING (is_admin());

-- ==================== ROLES ====================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_baca" ON roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "roles_admin_tulis" ON roles
  FOR ALL USING (is_admin());

-- ==================== PERMISSIONS ====================
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_baca" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "permissions_admin_tulis" ON permissions
  FOR ALL USING (is_admin());

-- ==================== ROLE PERMISSIONS ====================
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_baca" ON role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "role_permissions_admin_tulis" ON role_permissions
  FOR ALL USING (is_admin());

-- ==================== BIDANG ====================
ALTER TABLE bidang ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bidang_baca" ON bidang
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "bidang_admin_tulis" ON bidang
  FOR ALL USING (is_admin());
