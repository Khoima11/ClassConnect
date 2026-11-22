import { TombolKirim } from '@/components/client';
import { Judul, Kartu } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { semuaKelas, tahunAktif } from '@/lib/data';
import { sql } from '@/lib/db';
import { hapusKelas, tambahKelas, ubahWali } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Kelas() {
  await requireUser(['admin']);
  const [kelas, guru, ta] = await Promise.all([
    semuaKelas(),
    sql`select u.id, u.nama from users u join guru g on g.user_id = u.id where u.aktif order by u.nama`,
    tahunAktif(),
  ]);
  return (
    <>
      <Judul judul="Kelas & Wali Kelas" sub={`Tahun ajaran ${ta?.nama ?? '-'} ${ta?.semester ?? ''}`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Kartu className="lg:col-span-2">
          <table className="tabel">
            <thead><tr><th>Kelas</th><th>Siswa</th><th>Wali kelas</th><th></th></tr></thead>
            <tbody>
              {kelas.map((k) => (
                <tr key={k.id}>
                  <td className="font-medium">{k.nama}</td>
                  <td>{k.jumlah_siswa}</td>
                  <td>
                    <form action={ubahWali} className="flex gap-2">
                      <input type="hidden" name="id" value={k.id} />
                      <select name="wali" defaultValue={k.wali_kelas_id ?? ''} className="input py-1">
                        <option value="">- Belum ada -</option>
                        {guru.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}
                      </select>
                      <TombolKirim className="btn-secondary btn-sm">Simpan</TombolKirim>
                    </form>
                  </td>
                  <td>
                    <form action={hapusKelas}><input type="hidden" name="id" value={k.id} />
                      <TombolKirim className="btn-secondary btn-sm" konfirmasi={`Hapus kelas ${k.nama}? Jadwal, tugas, dan nilainya ikut terhapus.`}>Hapus</TombolKirim>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Kartu>
        <Kartu judul="Tambah kelas">
          <form action={tambahKelas} className="space-y-3">
            <input name="nama" placeholder="VII B" className="input" required />
            <select name="tingkat" className="input"><option value="7">Tingkat VII</option><option value="8">Tingkat VIII</option><option value="9">Tingkat IX</option></select>
            <select name="wali" className="input"><option value="">Wali kelas (opsional)</option>{guru.map((g) => <option key={g.id} value={g.id}>{g.nama}</option>)}</select>
            <TombolKirim>Tambah</TombolKirim>
          </form>
        </Kartu>
      </div>
    </>
  );
}
