import { HalamanDiagnosa } from '@/components/Diagnosa';
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
  const logo = linkFile(s.logo_path);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-navy-700 to-navy-900 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="mx-auto mb-3 h-16 w-16 rounded-full bg-white object-contain p-1" />
          ) : (
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-bold text-navy-700">CC</div>
          )}
          <h1 className="text-2xl font-bold text-white">ClassConnect</h1>
          <p className="text-sm text-navy-100">{s.nama}</p>
        </div>
        <div className="card">
          <FormLogin lanjut={sp.lanjut ?? '/dashboard'} />
        </div>
        {s.mode_demo && (
          <div className="mt-4 rounded-xl bg-white/10 p-4 text-white">
            <p className="mb-2 text-center text-xs text-navy-100">Mode demo · masuk cepat sebagai:</p>
            <div className="grid grid-cols-3 gap-2">
              {DEMO.map((d) => (
                <form key={d.u} action={loginDemo}>
                  <input type="hidden" name="username" value={d.u} />
                  <button className="w-full rounded-lg bg-white/15 px-2 py-2 text-xs font-medium hover:bg-white/25">{d.label}</button>
                </form>
              ))}
            </div>
            <p className="mt-2 text-center text-[11px] text-navy-100">Semua akun demo memakai kata sandi demo123</p>
          </div>
        )}
      </div>
    </main>
  );
}
