import { TombolKirim } from '@/components/client';
import { Bidang, Judul, Kartu } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { bobotAktif, tahunAktif } from '@/lib/data';
import { simpanBobot } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Bobot() {
  await requireUser(['admin']);
  const [b, ta] = await Promise.all([bobotAktif(), tahunAktif()]);
  return (
    <>
      <Judul judul="Bobot Nilai Akhir" sub={`Berlaku untuk tahun ajaran ${ta?.nama ?? '-'} ${ta?.semester ?? ''}. Jumlah harus 100%.`} />
      <Kartu className="max-w-lg">
        <form action={simpanBobot} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Bidang label="Tugas (%)"><input name="tugas" type="number" min={0} max={100} defaultValue={b.tugas} className="input" /></Bidang>
            <Bidang label="Ulangan Harian (%)"><input name="uh" type="number" min={0} max={100} defaultValue={b.uh} className="input" /></Bidang>
            <Bidang label="PTS (%)"><input name="pts" type="number" min={0} max={100} defaultValue={b.pts} className="input" /></Bidang>
            <Bidang label="PAS (%)"><input name="pas" type="number" min={0} max={100} defaultValue={b.pas} className="input" /></Bidang>
          </div>
          <p className="text-xs text-slate-500">Nilai akhir = Tugas × bobot + rata-rata UH × bobot + PTS × bobot + PAS × bobot. Komponen yang belum ada diabaikan sementara.</p>
          <TombolKirim>Simpan Bobot</TombolKirim>
        </form>
      </Kartu>
    </>
  );
}
