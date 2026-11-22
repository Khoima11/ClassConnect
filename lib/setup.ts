import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { sql } from './db';
import { SKEMA_SQL } from './schema';
import { isiDataDemo, isiDataKosong } from './seed';

/** true = tabel belum ada atau belum berisi; melempar error jika database tidak bisa dihubungi. */
export async function databaseKosong(): Promise<boolean> {
  try {
    const [r] = await sql`select count(*)::int as n from users`;
    return r.n === 0;
  } catch (e) {
    if ((e as { code?: string }).code === '42P01') return true; // tabel belum ada
    throw e;
  }
}

/** Membuat tabel, bucket penyimpanan, dan data contoh. Hanya berjalan saat database masih kosong. */
export async function siapkanDatabase(pilihan: { mode: 'demo' } | { mode: 'kosong'; namaSekolah: string; sandiAdmin: string } = { mode: 'demo' }) {
  await sql.unsafe(SKEMA_SQL);
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const bucket = process.env.SUPABASE_BUCKET || 'classconnect';
    const { data } = await supa.storage.getBucket(bucket);
    if (!data) {
      const { error } = await supa.storage.createBucket(bucket, { public: false, fileSizeLimit: 2 * 1024 * 1024 });
      if (error) throw new Error('Gagal membuat bucket penyimpanan: ' + error.message);
    }
  }
  if (pilihan.mode === 'kosong') await isiDataKosong(sql, pilihan.namaSekolah, pilihan.sandiAdmin);
  else await isiDataDemo(sql);
}
