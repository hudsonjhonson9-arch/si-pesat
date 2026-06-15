import os
import asyncio
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

supabase_url = os.environ.get("VITE_SUPABASE_URL")
supabase_key = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")

if not supabase_url or not supabase_key:
    print("Error: Supabase credentials not found.")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

TARGET_ENTITIES = [
    # SD (20)
    {"name": "SD Inpres Beradolu", "type": "SD"},
    {"name": "SD Inpres Doka Kaka", "type": "SD"},
    {"name": "SD Inpres Kurutepe", "type": "SD"},
    {"name": "SD Inpres Tana Rara", "type": "SD"},
    {"name": "SD Inpres Wee Sake", "type": "SD"},
    {"name": "SD Kristen Tunas Daud", "type": "SD"},
    {"name": "SD Inpres Dassa Elu", "type": "SD"},
    {"name": "SD Negeri Gollu Sapi", "type": "SD"},
    {"name": "SD Negeri Kabarara", "type": "SD"},
    {"name": "SD Negeri Lomana Padaka", "type": "SD"},
    {"name": "SD Negeri Pangadu Rade", "type": "SD"},
    {"name": "SD Masehi Wee Ranu", "type": "SD"},
    {"name": "SD Negeri Puu Weri", "type": "SD"},
    {"name": "SD Negeri Tabulo Dara", "type": "SD"},
    {"name": "SD Negeri Tillu Mareda", "type": "SD"},
    {"name": "SD Negeri Weekarou", "type": "SD"},
    {"name": "SD Masehi Waikabubak II", "type": "SD"},
    {"name": "SD Masehi Wee Kabete", "type": "SD"},
    {"name": "SD Negeri Bali Ledo", "type": "SD"},
    {"name": "SD Negeri Puukaniki", "type": "SD"},

    # SMP (9)
    {"name": "SMP NEGERI 1 LOLI", "type": "SMP"},
    {"name": "SMP NEGERI 2 LOLI", "type": "SMP"},
    {"name": "SMP NEGERI 3 LOLI", "type": "SMP"},
    {"name": "SMP NEGERI 4 LOLI", "type": "SMP"},
    {"name": "SMP NEGERI 5 LOLI", "type": "SMP"},
    {"name": "SMP NEGERI 6 LOLI", "type": "SMP"},
    {"name": "SMP NEGERI 7 LOLI", "type": "SMP"},
    {"name": "SMP SATAP KABARARA", "type": "SMP"},
    {"name": "SMP KRIS. TUNAS DAUD", "type": "SMP"},

    # SKPD (Badan/Dinas/Bagian) -> mapping based on naming conventions in HomeView.tsx?
    # Actually, they are either Dinas, Badan, or Sekretariat Daerah (Bagian)
    {"name": "Badan Keuangan dan Aset Daerah", "type": "Badan"},
    {"name": "Badan Pendapatan Daerah", "type": "Badan"},
    {"name": "Dinas Kesehatan", "type": "Dinas"},
    {"name": "Dinas Sosial", "type": "Dinas"},
    {"name": "Dinas Perikanan", "type": "Dinas"},
    {"name": "Dinas Peternakan dan Kesehatan Hewan", "type": "Dinas"},
    {"name": "Bagian Perekonomian dan SDA", "type": "Sekretariat Daerah"},
    {"name": "Bagian Protokol Komunikasi Pimpinan", "type": "Sekretariat Daerah"},
    {"name": "Bagian Pemerintahan", "type": "Sekretariat Daerah"},

    # Kecamatan
    {"name": "Kecamatan Loli", "type": "Kecamatan"},

    # Kelurahan
    {"name": "Kelurahan Loda Pare", "type": "Kelurahan"},

    # Desa
    {"name": "Desa Beradolu", "type": "Desa"},
    {"name": "Desa Dede kadu", "type": "Desa"},
    {"name": "Desa Ubu Pede", "type": "Desa"},
    {"name": "Desa Ubu Raya", "type": "Desa"},
    {"name": "Desa Doka Kaka", "type": "Desa"},
    {"name": "Desa Tema Tana", "type": "Desa"},
    {"name": "Desa Tana Rara", "type": "Desa"},
    {"name": "Desa Bali Ledo", "type": "Desa"},
    {"name": "Desa Manola", "type": "Desa"},

    # RS/Puskesmas
    {"name": "RSU Hoba Kalla", "type": "Puskesmas"},
    {"name": "Puskesmas Tana Rara", "type": "Puskesmas"},
    {"name": "Puskesmas Wee Karou", "type": "Puskesmas"}
]

def seed():
    print("Deleting old target_entities...")
    try:
        # We need to delete everything where id is not null. Wait, we can just delete all.
        res = supabase.table('target_entities').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print(f"Deleted old entities: {res}")
    except Exception as e:
        print(f"Error deleting: {e}")

    print("Inserting new target_entities...")
    try:
        # We can insert them in batches if needed, but 40 is fine
        res = supabase.table('target_entities').insert(TARGET_ENTITIES).execute()
        print(f"Inserted {len(res.data)} entities successfully!")
    except Exception as e:
        print(f"Error inserting: {e}")

if __name__ == "__main__":
    seed()
