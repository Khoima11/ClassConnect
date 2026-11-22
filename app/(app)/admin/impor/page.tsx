import { TombolKirim } from '@/components/client';
import { Bidang, Judul, Kartu } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sekolah } from '@/lib/data';
import { imporData } from './actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function Impor() {
  await requireUser(['admin']);
  const demo = (await sekolah()).mode_demo;
  return (
    <>
      <Judul judul="Impor Data dari Excel" sub="Cara tercepat memindahkan data sekolah sungguhan ke ClassConnect." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Kartu judul="Langkah">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>Unduh template: <a href="/api/template?jenis=siswa" className="tautan">template siswa</a> atau <a href="/api/template?jenis=guru" className="tautan">template guru</a>.</li>
            <li>Buka di Excel, isi data mulai baris ke-2. Jangan ubah baris judul kolom.</li>
            <li>Simpan dengan <b>File → Save As → CSV (Comma delimited)</b>.</li>
            <li>Unggah file CSV di samping. Kelas harus sudah dibuat dan ditulis persis sama (misalnya <code>VII A</code>).</li>
          </ol>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            Username siswa = NISN, username orang tua = <code>ortu</code>+NISN, username guru = kolom username (atau NIP).{' '}
            {demo ? <>Karena mode demo aktif, semua akun hasil impor memakai kata sandi <b>demo123</b>.</> : <>Kata sandi awal siswa dan orang tua = NISN, guru = NIP (atau username). Minta pengguna menggantinya setelah login.</>}
          </p>
        </Kartu>
        <Kartu judul="Unggah file">
          <form action={imporData} className="space-y-4">
            <Bidang label="Jenis data"><select name="jenis" className="input"><option value="siswa">Siswa (+ orang tua)</option><option value="guru">Guru</option></select></Bidang>
            <Bidang label="File CSV"><input type="file" name="file" accept=".csv,text/csv" className="block w-full text-sm" required /></Bidang>
            <TombolKirim>Impor</TombolKirim>
          </form>
        </Kartu>
      </div>
    </>
  );
}
