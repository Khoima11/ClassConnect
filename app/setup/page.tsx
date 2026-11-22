import { redirect } from 'next/navigation';
import { TombolKirim } from '@/components/client';
import { databaseKosong, siapkanDatabase } from '@/lib/setup';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function jalankan(fd: FormData) {
  'use server';
  if (!(await databaseKosong())) redirect('/login');
  const kosong = fd.get('mode') === 'kosong';
  const namaSekolah = String(fd.get('nama_sekolah') ?? '').trim();
  const sandi = String(fd.get('sandi_admin') ?? '');
  if (kosong && (!namaSekolah || sandi.length < 8)) redirect('/setup?galat=' + encodeURIComponent('Isi nama madrasah dan kata sandi admin minimal 8 karakter.'));
  try {
    await siapkanDatabase(kosong ? { mode: 'kosong', namaSekolah, sandiAdmin: sandi } : { mode: 'demo' });
  } catch (e) {
    redirect('/setup?galat=' + encodeURIComponent((e as Error).message));
  }
  redirect('/login');
}

export default async function Setup({ searchParams }: { searchParams: Promise<{ galat?: string }> }) {
  const { galat } = await searchParams;
  if (!(await databaseKosong())) redirect('/login');
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SESSION_SECRET: (process.env.SESSION_SECRET ?? '').length >= 32,
  };
  const siap = env.DATABASE_URL && env.SESSION_SECRET; // Supabase Storage wajib saat di Vercel agar unggah file berfungsi
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-navy-700 to-navy-900 p-4">
      <div className="card w-full max-w-md">
        <h1 className="text-lg font-bold">Siapkan Database ClassConnect</h1>
        <p className="mt-1 text-sm text-slate-600">Langkah ini hanya muncul sekali, saat database masih kosong. Tabel, tempat penyimpanan file, dan data contoh MTs fiktif akan dibuat.</p>
        <ul className="mt-4 space-y-1 text-sm">
          {Object.entries(env).map(([k, ok]) => (
            <li key={k} className="flex justify-between"><code>{k}</code><span className={ok ? 'text-hijau-700' : 'text-red-600'}>{ok ? '✓ terisi' : k === 'SESSION_SECRET' ? '✗ minimal 32 karakter' : k.startsWith('SUPABASE') ? '⚠ belum diisi (unggah file tidak berfungsi)' : '✗ belum diisi'}</span></li>
          ))}
        </ul>
        {galat && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">Gagal: {galat}</p>}
        {siap ? (
          <form action={jalankan} className="mt-5 space-y-3">
            <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm">
              <input type="radio" name="mode" value="demo" defaultChecked className="mt-1" />
              <span><b>Versi demo</b> (disarankan sekarang): MTs fiktif lengkap dengan 68 akun dan data contoh. Semua akun memakai kata sandi demo123.</span>
            </label>
            <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm">
              <input type="radio" name="mode" value="kosong" className="mt-1" />
              <span><b>Sekolah sungguhan</b>: database kosong, hanya akun <code>admin</code>. Data lalu diisi lewat menu Data Master atau Impor Excel.</span>
            </label>
            <input name="nama_sekolah" placeholder="Nama madrasah (untuk sekolah sungguhan)" className="input" />
            <input name="sandi_admin" type="password" placeholder="Kata sandi admin, min. 8 karakter (untuk sekolah sungguhan)" className="input" />
            <TombolKirim className="btn-hijau w-full">Siapkan Database Sekarang</TombolKirim>
          </form>
        ) : (
          <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Lengkapi Environment Variables di Vercel (lihat README), lalu Redeploy.</p>
        )}
      </div>
    </main>
  );
}
