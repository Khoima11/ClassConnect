import Link from 'next/link';
import { InputFile, TombolKirim } from '@/components/client';
import { Bidang, Judul, Kartu } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { semuaKelas } from '@/lib/data';
import { sql } from '@/lib/db';
import { buatPengumuman } from '../actions';

export const dynamic = 'force-dynamic';

export default async function PengumumanBaru() {
  const user = await requireUser(['admin', 'kepala', 'guru']);
  const guru = user.peran === 'guru';
  const kelas = guru
    ? await sql`select id, nama from kelas where wali_kelas_id = ${user.id} or id in (select kelas_id from pengampu where guru_id = ${user.id}) order by tingkat, nama`
    : await semuaKelas();
  return (
    <>
      <Judul judul="Buat Pengumuman" aksi={<Link href="/pengumuman" className="btn-secondary">Batal</Link>} />
      <Kartu className="max-w-2xl">
        <form action={buatPengumuman} className="space-y-4">
          <Bidang label="Judul"><input name="judul" className="input" required maxLength={150} /></Bidang>
          <Bidang label="Isi pengumuman"><textarea name="isi" rows={6} className="input" required /></Bidang>
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="Kelas tujuan">
              <select name="sasaran_kelas_id" className="input" required={guru}>
                {!guru && <option value="">Seluruh madrasah</option>}
                {kelas.map((k: any) => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}
              </select>
            </Bidang>
            <Bidang label="Penerima">
              <select name="sasaran_peran" className="input">
                <option value="">{guru ? 'Siswa dan orang tua' : 'Semua peran'}</option>
                {!guru && <option value="guru">Guru saja</option>}
                <option value="siswa">Siswa saja</option>
                <option value="ortu">Orang tua saja</option>
              </select>
            </Bidang>
            <Bidang label="Mulai tayang (WIB)" ket="Kosongkan untuk tayang sekarang"><input type="datetime-local" name="tayang_mulai" className="input" /></Bidang>
            <Bidang label="Akhir tayang (WIB)" ket="Kosongkan jika tidak ada batas"><input type="datetime-local" name="tayang_akhir" className="input" /></Bidang>
          </div>
          <Bidang label="Lampiran (opsional)"><InputFile name="lampiran" /></Bidang>
          {!guru && (
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="disematkan" className="h-4 w-4" /> Sematkan di urutan teratas</label>
          )}
          <TombolKirim>Terbitkan</TombolKirim>
        </form>
      </Kartu>
    </>
  );
}
