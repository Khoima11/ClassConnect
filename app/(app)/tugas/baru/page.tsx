import Link from 'next/link';
import { InputFile, TombolKirim } from '@/components/client';
import { Bidang, Judul, Kartu, Kosong } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { pengampuGuru } from '@/lib/data';
import { keInputWaktu } from '@/lib/time';
import { buatTugas } from '../actions';

export const dynamic = 'force-dynamic';

export default async function TugasBaru() {
  const user = await requireUser(['guru']);
  const daftar = await pengampuGuru(user.id);
  const bawaan = keInputWaktu(new Date(Date.now() + 3 * 86400000)).slice(0, 11) + '23:59';
  return (
    <>
      <Judul judul="Buat Tugas" aksi={<Link href="/tugas" className="btn-secondary">Batal</Link>} />
      <Kartu className="max-w-2xl">
        {daftar.length === 0 ? <Kosong>Anda belum ditugaskan mengajar di kelas mana pun.</Kosong> : (
          <form action={buatTugas} className="space-y-4">
            <Bidang label="Kelas & mapel">
              <select name="pengampu_id" className="input" required>
                {daftar.map((p) => <option key={p.id} value={p.id}>{p.mapel_nama} · {p.kelas_nama}</option>)}
              </select>
            </Bidang>
            <Bidang label="Judul tugas"><input name="judul" className="input" required maxLength={150} /></Bidang>
            <Bidang label="Deskripsi / petunjuk"><textarea name="deskripsi" rows={5} className="input" /></Bidang>
            <div className="grid gap-4 sm:grid-cols-2">
              <Bidang label="Tenggat (WIB)"><input type="datetime-local" name="tenggat" defaultValue={bawaan} className="input" required /></Bidang>
              <label className="flex items-center gap-2 pt-6 text-sm">
                <input type="checkbox" name="boleh_terlambat" defaultChecked className="h-4 w-4" />
                Boleh dikumpulkan setelah tenggat (ditandai Terlambat)
              </label>
            </div>
            <Bidang label="Lampiran (opsional, maks. 2 MB)"><InputFile name="lampiran" /></Bidang>
            <Bidang label="Tautan materi (opsional)" ket="Misalnya Google Drive atau YouTube"><input name="tautan" type="url" placeholder="https://" className="input" /></Bidang>
            <TombolKirim>Simpan & Kirim ke Siswa</TombolKirim>
          </form>
        )}
      </Kartu>
    </>
  );
}
