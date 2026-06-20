-- Run this in your Supabase SQL Editor

-- 1. Create Profiles table for User Roles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT,
  is_admin BOOLEAN DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add is_admin column and update role CHECK constraint for existing databases
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
UPDATE profiles SET role = 'Auditor Pelaksana' WHERE role = 'Auditor';
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN (
    'Auditor Pelaksana', 'Auditor Pelaksana Lanjutan', 'Auditor Penyelia',
    'Auditor Ahli Pertama', 'Auditor Ahli Muda', 'Auditor Ahli Madya', 'Auditor Ahli Utama',
    'PPUPD Ahli Pertama', 'PPUPD Ahli Muda', 'PPUPD Ahli Madya', 'PPUPD Ahli Utama',
    'Inspektur Pembantu', 'Inspektur'
  ));

-- Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'Auditor Pelaksana');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Create Audits table for KKA Data
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opd_name TEXT NOT NULL,
  opd_type TEXT NOT NULL,
  fiscal_year TEXT NOT NULL,
  auditor_name TEXT NOT NULL,
  audit_date DATE NOT NULL,
  status TEXT NOT NULL,
  progress NUMERIC DEFAULT 0,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  team_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_audits_updated
  BEFORE UPDATE ON audits
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE audits DISABLE ROW LEVEL SECURITY;

-- 3. Create Templates table for KKA Templates
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER on_templates_updated
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- 4. Create Target Entities table for Wilayah Pengawasan
CREATE TABLE target_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('OPD', 'Desa', 'Sekolah', 'Puskesmas', 'Lainnya')),
  head_name TEXT,
  contact TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE target_entities DISABLE ROW LEVEL SECURITY;

-- 5. Seed Target Entities Data untuk IRBAN IV
INSERT INTO target_entities (name, type) VALUES 
('Badan Keuangan dan Aset Daerah', 'OPD'),
('Badan Pendapatan Daerah', 'OPD'),
('Dinas Kesehatan', 'OPD'),
('Dinas Sosial', 'OPD'),
('Dinas Perikanan', 'OPD'),
('Dinas Peternakan dan Kesehatan Hewan', 'OPD'),
('Bagian Perekonomian dan SDA', 'OPD'),
('Bagian Protokol dan Komunikasi Pimpinan', 'OPD'),
('Bagian Pemerintahan', 'OPD'),
('Kecamatan Loli', 'OPD'),
('SD, SMP, se Kecamatan Loli', 'Sekolah'),
('Desa/Kelurahan se Kecamatan Loli', 'Desa'),
('Puskesmas Tanarara', 'Puskesmas'),
('Puskesmas Wee Karou', 'Puskesmas');

-- Set admin for muthia.salsabila@google.com
UPDATE profiles SET is_admin = true WHERE email = 'muthia.salsabila@google.com';

