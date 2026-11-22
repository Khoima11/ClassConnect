import { HalamanDiagnosa } from '@/components/Diagnosa';
import { Ilustrasi } from '@/components/Ilustrasi';
import { Logo } from '@/components/Logo';
import { sekolah } from '@/lib/data';
import { periksaDatabase } from '@/lib/diagnosa';
import { linkFile } from '@/lib/storage';
import { loginDemo } from './actions';
import FormLogin from './FormLogin';

export const dynamic = 'force-dynamic';

const DEMO = [
  { u: 'admin', label: 'Admin' },
  { u: 'kepala', label: 'Kepala' },
  { u: 'guru1', label: 'Guru' },
  { u: 'siswa1', label: 'Siswa' },
  { u: 'ortu1', label: 'Orang Tua' },
];

export default async function HalamanLogin({ searchParams }: { searchParams: Promise<{ lanjut?: string }> }) {
  const sp = await searchParams;
  const masalah = await periksaDatabase();
  if (masalah) return <HalamanDiagnosa d={masalah} />;
  const s = await sekolah();
  const logoSekolah = linkFile(s.logo_path);

  return (
    <main className="min-h-screen bg-latar lg:grid lg:grid-cols-2">
      {/* Sisi kiri: identitas dan ilustrasi */}
      <section className="relative flex flex-col overflow-hidden rounded-b-[2.5rem] bg-navy-700 px-6 pb-10 pt-8 text-white lg:rounded-none lg:px-14 lg:py-12">
        <div className="flex items-center gap-3">
          <Logo size={44} />
          <div className="leading-tight">
            <p className="text-xl font-extrabold">Class<span className="text-emas-500">Connect</span></p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-navy-100">Sistem Informasi Madrasah</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center lg:py-10">
          <Ilustrasi className="w-full max-w-[300px] lg:max-w-[420px]" />
          <h1 className="mt-6 text-xl font-extrabold uppercase leading-snug tracking-wide text-white lg:text-3xl">
            Terhubung, belajar,
            <br />
            berkembang bersama
          </h1>
          <p className="mt-3 max-w-sm text-sm text-navy-100">
            Jadwal, kehadiran, tugas, nilai, dan pengumuman madrasah dalam satu aplikasi untuk siswa, guru, dan orang tua.
          </p>
          <div className="mt-5 flex items-center gap-2" aria-hidden>
            <span className="h-2 w-6 rounded-full bg-emas-500" />
            <span className="h-2 w-2 rounded-full bg-white/40" />
            <span className="h-2 w-2 rounded-full bg-white/40" />
          </div>
        </div>
      </section>

      {/* Sisi kanan: formulir masuk */}
      <section className="flex items-start justify-center px-5 py-8 lg:items-center lg:py-12">
        <div className="w-full max-w-sm">
          <div className="mb-5 flex items-center gap-3">
            {logoSekolah ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSekolah} alt="" className="h-12 w-12 rounded-full bg-white object-contain p-1 ring-2 ring-emas-500" />
            ) : null}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emas-600">Selamat datang di</p>
              <p className="text-lg font-extrabold text-navy-900">{s.nama}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl shadow-[0_10px_30px_rgba(20,38,64,0.12)]">
            <div className="flex bg-white px-6 pt-5">
              <span className="border-b-[3px] border-emas-500 pb-3 text-sm font-extrabold uppercase tracking-widest text-navy-900">Masuk</span>
            </div>
            <div className="bg-emas-500 px-6 py-6">
              <FormLogin lanjut={sp.lanjut ?? '/dashboard'} />
            </div>
          </div>

          {s.mode_demo && (
            <div className="mt-5 rounded-2xl bg-navy-700 p-4 text-white">
              <p className="mb-2 text-center text-[11px] font-bold uppercase tracking-wider text-emas-400">Mode demo · masuk cepat sebagai</p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO.map((d) => (
                  <form key={d.u} action={loginDemo}>
                    <input type="hidden" name="username" value={d.u} />
                    <button className="w-full rounded-xl bg-white/10 px-2 py-2 text-xs font-semibold hover:bg-white/20">{d.label}</button>
                  </form>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-navy-100">Semua akun demo memakai kata sandi demo123</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
