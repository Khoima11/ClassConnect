import { TombolKirim } from '@/components/client';
import { Bidang, Judul, Kartu, Kosong, TabelWadah } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { pengampuKelas, semuaKelas } from '@/lib/data';
import { sql } from '@/lib/db';
import { NAMA_HARI, jam } from '@/lib/time';
import { hapusJadwal, tambahJadwal } from '../actions';

export const dynamic = 'force-dynamic';

const JAM_BAWAAN: Record<number, [string, string]> = {
  1: ['07:30', '08:50'], 2: ['08:50', '10:10'], 3: ['10:30', '11:50'], 4: ['12:30', '13:50'], 5: ['13:50', '15:10'],
};

export default async function KelolaJadwal({ searchParams }: { searchParams: Promise<{ kelas?: string }> }) {
  await requireUser(['admin']);
  const sp = await searchParams;
  const kelas = await semuaKelas();
  const kelasId = Number(sp.kelas) || kelas[0]?.id;
  if (!kelasId) return <Kosong>Buat kelas terlebih dahulu.</Kosong>;
  const [mapel, data] = await Promise.all([
    pengampuKelas(kelasId),
    sql`select j.*, m.nama as mapel, g.nama as guru from jadwal j join pengampu p on p.id = j.pengampu_id
        join mapel m on m.id = p.mapel_id join users g on g.id = p.guru_id where p.kelas_id = ${kelasId} order by j.hari, j.jam_ke`,
  ]);
  const maksJam = Math.max(4, ...data.map((d) => d.jam_ke));
  const hitung = (pid: number) => data.filter((d) => d.pengampu_id === pid).length;

  return (
    <>
      <Judul
        judul="Kelola Jadwal"
        sub="Sistem menolak slot yang bentrok, baik di kelas yang sama maupun untuk guru yang sama."
        aksi={
          <form className="flex gap-2">
            <select name="kelas" defaultValue={kelasId} className="input w-auto">{kelas.map((k) => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}</select>
            <button className="btn-secondary">Pilih</button>
          </form>
        }
      />
      <div className="grid gap-4 xl:grid-cols-3">
        <Kartu className="xl:col-span-2" judul={`Jadwal kelas ${kelas.find((k) => k.id === kelasId)?.nama}`}>
          <TabelWadah>
            <table className="tabel min-w-[720px]">
              <thead><tr><th>Jam</th>{[1, 2, 3, 4, 5, 6].map((h) => <th key={h}>{NAMA_HARI[h]}</th>)}</tr></thead>
              <tbody>
                {Array.from({ length: maksJam }, (_, i) => i + 1).map((jk) => (
                  <tr key={jk}>
                    <td className="text-xs text-slate-500">Ke-{jk}</td>
                    {[1, 2, 3, 4, 5, 6].map((h) => {
                      const d = data.find((x) => x.hari === h && x.jam_ke === jk);
                      return (
                        <td key={h}>
                          {d ? (
                            <div className="rounded-md bg-white p-1.5 ring-1 ring-slate-200">
                              <p className="text-xs font-semibold">{d.mapel}</p>
                              <p className="text-[11px] text-slate-500">{d.guru}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] text-slate-400">{jam(d.jam_mulai)}–{jam(d.jam_selesai)}</span>
                                <form action={hapusJadwal}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="kelas_id" value={kelasId} /><button className="text-[11px] text-red-600 hover:underline">hapus</button></form>
                              </div>
                            </div>
                          ) : <span className="text-xs text-slate-300">kosong</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </TabelWadah>
        </Kartu>
        <div className="space-y-4">
          <Kartu judul="Tambah slot">
            {mapel.length === 0 ? <Kosong>Atur guru pengampu kelas ini dulu di menu Mapel.</Kosong> : (
              <form action={tambahJadwal} className="space-y-3">
                <input type="hidden" name="kelas_id" value={kelasId} />
                <Bidang label="Mapel & guru"><select name="pengampu_id" className="input">{mapel.map((p) => <option key={p.id} value={p.id}>{p.mapel_nama} · {p.guru_nama}</option>)}</select></Bidang>
                <div className="grid grid-cols-2 gap-3">
                  <Bidang label="Hari"><select name="hari" className="input">{[1, 2, 3, 4, 5, 6].map((h) => <option key={h} value={h}>{NAMA_HARI[h]}</option>)}</select></Bidang>
                  <Bidang label="Jam ke-"><select name="jam_ke" className="input">{[1, 2, 3, 4, 5, 6, 7, 8].map((j) => <option key={j} value={j}>{j}</option>)}</select></Bidang>
                  <Bidang label="Mulai"><input type="time" name="jam_mulai" defaultValue={JAM_BAWAAN[1][0]} className="input" required /></Bidang>
                  <Bidang label="Selesai"><input type="time" name="jam_selesai" defaultValue={JAM_BAWAAN[1][1]} className="input" required /></Bidang>
                </div>
                <p className="text-xs text-slate-500">Jam bawaan: {Object.entries(JAM_BAWAAN).map(([k, [a, b]]) => `ke-${k} ${a}–${b}`).join(', ')}</p>
                <TombolKirim>Tambah ke Jadwal</TombolKirim>
              </form>
            )}
          </Kartu>
          <Kartu judul="Pertemuan per minggu">
            <ul className="space-y-1 text-sm">
              {mapel.map((p) => (
                <li key={p.id} className="flex justify-between"><span>{p.mapel_nama}</span><span className={hitung(p.id) === 0 ? 'text-amber-600' : 'text-slate-500'}>{hitung(p.id)}×</span></li>
              ))}
            </ul>
          </Kartu>
        </div>
      </div>
    </>
  );
}
