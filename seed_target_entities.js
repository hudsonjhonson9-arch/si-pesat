import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials not found.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_ENTITIES = [
    // SD (20)
    {name: "SD Inpres Beradolu", type: "SD"},
    {name: "SD Inpres Doka Kaka", type: "SD"},
    {name: "SD Inpres Kurutepe", type: "SD"},
    {name: "SD Inpres Tana Rara", type: "SD"},
    {name: "SD Inpres Wee Sake", type: "SD"},
    {name: "SD Kristen Tunas Daud", type: "SD"},
    {name: "SD Inpres Dassa Elu", type: "SD"},
    {name: "SD Negeri Gollu Sapi", type: "SD"},
    {name: "SD Negeri Kabarara", type: "SD"},
    {name: "SD Negeri Lomana Padaka", type: "SD"},
    {name: "SD Negeri Pangadu Rade", type: "SD"},
    {name: "SD Masehi Wee Ranu", type: "SD"},
    {name: "SD Negeri Puu Weri", type: "SD"},
    {name: "SD Negeri Tabulo Dara", type: "SD"},
    {name: "SD Negeri Tillu Mareda", type: "SD"},
    {name: "SD Negeri Weekarou", type: "SD"},
    {name: "SD Masehi Waikabubak II", type: "SD"},
    {name: "SD Masehi Wee Kabete", type: "SD"},
    {name: "SD Negeri Bali Ledo", type: "SD"},
    {name: "SD Negeri Puukaniki", type: "SD"},

    // SMP (9)
    {name: "SMP NEGERI 1 LOLI", type: "SMP"},
    {name: "SMP NEGERI 2 LOLI", type: "SMP"},
    {name: "SMP NEGERI 3 LOLI", type: "SMP"},
    {name: "SMP NEGERI 4 LOLI", "type": "SMP"},
    {name: "SMP NEGERI 5 LOLI", "type": "SMP"},
    {name: "SMP NEGERI 6 LOLI", "type": "SMP"},
    {name: "SMP NEGERI 7 LOLI", "type": "SMP"},
    {name: "SMP SATAP KABARARA", type: "SMP"},
    {name: "SMP KRIS. TUNAS DAUD", type: "SMP"},

    // SKPD
    {name: "Badan Keuangan dan Aset Daerah", type: "Badan"},
    {name: "Badan Pendapatan Daerah", type: "Badan"},
    {name: "Dinas Kesehatan", type: "Dinas"},
    {name: "Dinas Sosial", type: "Dinas"},
    {name: "Dinas Perikanan", type: "Dinas"},
    {name: "Dinas Peternakan dan Kesehatan Hewan", type: "Dinas"},
    {name: "Bagian Perekonomian dan SDA", type: "Sekretariat Daerah"},
    {name: "Bagian Protokol Komunikasi Pimpinan", type: "Sekretariat Daerah"},
    {name: "Bagian Pemerintahan", type: "Sekretariat Daerah"},

    // Kecamatan
    {name: "Kecamatan Loli", type: "Kecamatan"},

    // Kelurahan
    {name: "Kelurahan Loda Pare", type: "Kelurahan"},

    // Desa
    {name: "Desa Beradolu", type: "Desa"},
    {name: "Desa Dede kadu", type: "Desa"},
    {name: "Desa Ubu Pede", type: "Desa"},
    {name: "Desa Ubu Raya", type: "Desa"},
    {name: "Desa Doka Kaka", type: "Desa"},
    {name: "Desa Tema Tana", type: "Desa"},
    {name: "Desa Tana Rara", type: "Desa"},
    {name: "Desa Bali Ledo", type: "Desa"},
    {name: "Desa Manola", type: "Desa"},

    // RS/Puskesmas
    {name: "RSU Hoba Kalla", type: "Puskesmas"},
    {name: "Puskesmas Tana Rara", type: "Puskesmas"},
    {name: "Puskesmas Wee Karou", type: "Puskesmas"}
];

async function seed() {
    console.log("Deleting old target_entities...");
    try {
        const { data: allEntities, error: fetchError } = await supabase.from('target_entities').select('id');
        if (fetchError) throw fetchError;
        
        const ids = allEntities.map(e => e.id);
        if (ids.length > 0) {
            const { error: deleteError } = await supabase.from('target_entities').delete().in('id', ids);
            if (deleteError) throw deleteError;
        }
        console.log("Deleted old entities successfully.");
    } catch (e) {
        console.error("Error deleting:", e);
    }

    console.log("Inserting new target_entities...");
    try {
        const { data, error } = await supabase.from('target_entities').insert(TARGET_ENTITIES).select();
        if (error) throw error;
        console.log(`Inserted ${data.length} entities successfully!`);
    } catch (e) {
        console.error("Error inserting:", e);
    }
}

seed();
