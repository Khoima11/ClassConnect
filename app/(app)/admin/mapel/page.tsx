import { TombolKirim } from '@/components/client';
import { Judul, Kartu, Lencana } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { semuaKelas } from '@/lib/data';
import { sql } from '@/lib/db';
import { hapusMapel, simpanPengampu, tambahMapel } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Mapel({ searchParams }: { searchParams: Promise<{ kelas?: string }> }) {
  await requireUser(['admin']);
  const sp = await searchParams;
  const [mapel, guru, kelas] = await Promise.all([
    sql`select * from mapel order by kelompok desc, nama`,
    sql`select u.id, u.nama from users u join guru g on g.user_id = u.id where u.aktif order by u.nama`,
    semuaKelas(),
  ]);
  const kelasId = Number(sp.kelas) || kelas[0]?.id;
  const pengampu = kelasId ? await sql`select mapel_id, guru_id from pengampu where kelas_id = ${kelasId}` : [];
  return (
    <>
      <Judul judul="Mapel & Guru Pengampu" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Kartu
          judul="Guru pengampu per kelas"
          aksi={
            <form className="flex gap-2">
              <select name="kelas" defaultValue={kelasId} className="input w-auto py-1">{kelas.map((k) => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}</select>
              <button className="btn-secondary btn-sm">Pilih</button>
            </form>
          }
        >
          {kelasId && (
            <form action={simpanPengampu} className="space-y-2">
              <input type="hidden" name="kelas_id" value={kelasId} />
              {mapel.map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="w-44 text-sm">{m.nama}</span>
                  <select name={`guru_${m.id}`} defaultValue={pengampu.find((p) => p.mapel_id === m.id)?.guru_id ?? ''} className="input py-1">
                    <option value="">- Tidak diajarkan -</option>
                    {guru.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                  </select>
                </div>
              ))}
              <p className="pt-1 text-xs text-slate-500">Mengosongkan guru akan menghapus jadwal, tugas, dan nilai mapel itu di kelas ini.</p>
              <TombolKirim>Simpan Pembagian</TombolKirim>
            </form>
          )}
        </Kartu>
        <div className="space-y-4">
          <Kartu judul="Daftar mapel">
            <table className="tabel">
              <thead><tr><th>Kode</th><th>Nama</th><th>Kelompok</th><th></th></tr></thead>
              <tbody>
                {mapel.map((m) => (
                  <tr key={m.id}>
                    <td>{m.kode}</td><td>{m.nama}</td><td><Lencana warna={m.kelompok === 'PAI' ? 'hijau' : 'biru'}>{m.kelompok}</Lencana></td>
                    <td><form action={hapusMapel}><input type="hidden" name="id" value={m.id} /><TombolKirim className="btn-secondary btn-sm" konfirmasi={`Hapus mapel ${m.nama} di semua kelas?`}>Hapus</TombolKirim></form></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Kartu>
          <Kartu judul="Tambah mapel">
            <form action={tambahMapel} className="grid gap-3 sm:grid-cols-3">
              <input name="kode" placeholder="Kode (mis. PJOK)" className="input" required />
              <input name="nama" placeholder="Nama mapel" className="input" required />
              <select name="kelompok" className="input"><option value="Umum">Umum</option><option value="PAI">PAI</option></select>
              <div className="sm:col-span-3"><TombolKirim>Tambah</TombolKirim></div>
            </form>
          </Kartu>
        </div>
      </div>
    </>
  );
}
