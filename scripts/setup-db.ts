// Menyiapkan database dan bucket penyimpanan, lalu mengisi data contoh.
// Jalankan: npm run db:setup          (isi data contoh hanya jika database masih kosong)
//           npm run db:setup -- --reset (hapus semua data lalu isi ulang data contoh)
import { config } from 'dotenv';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';
import { isiDataDemo, SANDI_DEMO } from '../lib/seed';
import { SKEMA_SQL } from '../lib/schema';

config({ path: '.env.local' });
config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL belum diisi. Salin .env.example menjadi .env.local lalu isi nilainya.');
  const sql = postgres(url, { prepare: false, ssl: /supabase\.(co|com)/.test(url) ? 'require' : false, onnotice: () => {} });

  console.log('1/3 Membuat tabel...');
  await sql.unsafe(SKEMA_SQL);

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('2/3 Menyiapkan bucket penyimpanan file...');
    const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const bucket = process.env.SUPABASE_BUCKET || 'classconnect';
    const { data } = await supa.storage.getBucket(bucket);
    if (!data) {
      const { error } = await supa.storage.createBucket(bucket, { public: false, fileSizeLimit: 2 * 1024 * 1024 });
      if (error) throw error;
    }
  } else {
    console.log('2/3 SUPABASE_URL tidak diisi: file disimpan di folder .uploads (hanya untuk komputer sendiri).');
  }

  const [{ n }] = await sql`select count(*)::int as n from users`;
  if (n === 0 || process.argv.includes('--reset')) {
    console.log('3/3 Mengisi data contoh MTs fiktif...');
    await isiDataDemo(sql);
    console.log(`Selesai. Login dengan admin / guru1 / siswa1 / ortu1 / kepala, kata sandi: ${SANDI_DEMO}`);
  } else {
    console.log('3/3 Database sudah berisi data, data contoh tidak diisi ulang. Pakai --reset untuk mengisi ulang.');
  }
  await sql.end();
}

main().catch((e) => {
  console.error('Gagal:', e.message ?? e);
  process.exit(1);
});
