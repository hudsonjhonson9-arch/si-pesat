ALTER TABLE profiles ADD COLUMN IF NOT EXISTS jenis_asn TEXT CHECK (jenis_asn IN ('PNS', 'PPPK'));
