import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pmtmczqxrciaslgmjfim.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtdG1jenF4cmNpYXNsZ21qZmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMzY2NzQsImV4cCI6MjA5NjgxMjY3NH0.5kF1pq_MyvzqCl3Jhv2HvbNwjCpyBQWllhZUnsHZlMg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('target_entities')
    .insert([
      { name: 'Kelurahan Diratana', type: 'Kelurahan' },
      { name: 'Kelurahan Lodapare', type: 'Kelurahan' },
      { name: 'Kelurahan weekerou', type: 'Kelurahan' },
      { name: 'Kelurahan sobawawi', type: 'Kelurahan' },
      { name: 'Kelurahan Weedabo', type: 'Kelurahan' }
    ]);

  if (error) {
    console.error('Error inserting data:', error);
  } else {
    console.log('Data inserted successfully!');
  }
}

main();
