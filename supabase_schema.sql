-- Run this in your Supabase SQL Editor

-- 1. Create Profiles table for User Roles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('Auditor', 'Inspektur Pembantu', 'Inspektur')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 'Auditor');
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
  budget NUMERIC NOT NULL,
  status TEXT NOT NULL,
  progress NUMERIC DEFAULT 0,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  team_members JSONB NOT NULL DEFAULT '[]'::jsonb,
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
