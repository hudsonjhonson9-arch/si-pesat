import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://pmtmczqxrciaslgmjfim.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdG1jenF4cmNpYXNsZ21qZmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMzY2NzQsImV4cCI6MjA5NjgxMjY3NH0.5kF1pq_MyvzqCl3Jhv2HvbNwjCpyBQWllhZUnsHZlMg'
);

const users = [
  { email: 'margaretha.loe.mau@google.com', name: 'Margaretha Loe Mau, S.Kom, M.Si' },
  { email: 'eduard.dapa.mogo@google.com', name: 'Eduard Dapa Mogo, S.Pd' },
  { email: 'erwin.fitra.badare@google.com', name: 'Erwin Fitra Badare, S.E, M.M' },
  { email: 'tri.sutrisno.pua@google.com', name: 'Tri Sutrisno Pua, S.T' },
  { email: 'nimrot.malo@google.com', name: 'Nimrot Malo, S.P' },
  { email: 'pipit.annisa.fitria@google.com', name: 'Pipit Annisa Fitria, S.Ak' },
  { email: 'don.bosco.sadhi.marawali@google.com', name: 'Don Bosco Sadhi Marawali, S.E' },
  { email: 'amey.lisna.yunita@google.com', name: 'Amey Lisna Yunita, S.P' },
  { email: 'maria.diana.ona.ine@google.com', name: 'Maria Diana Ona Ine, S.Tr.M' },
  { email: 'gregorius.kalinoswky.solo.adang@google.com', name: 'Gregorius Kalinoswky Solo Adang, S.Sos' },
  { email: 'jekri.dapaole.salmon.mawo@google.com', name: 'Jekri Dapaole Salmon Mawo, S.T' },
  { email: 'muthia.salsabila@google.com', name: 'Muthia Salsabila, S.P' },
  { email: 'sufriyani@google.com', name: 'Sufriyani, S.E' }
];

async function createUsers() {
  for (const user of users) {
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: 'Irban4makmur',
      options: {
        data: {
          full_name: user.name,
          role: 'Auditor'
        }
      }
    });

    if (error) {
      console.error(`Failed to create ${user.email}:`, error.message);
    } else {
      console.log(`Created ${user.email} successfully.`);
    }
    
    // Add small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 500));
  }
}

createUsers();
