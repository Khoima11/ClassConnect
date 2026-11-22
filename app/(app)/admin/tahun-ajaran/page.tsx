import { TombolKirim } from '@/components/client';
import { Judul, Kartu, Lencana } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { aktifkanTahunAjaran, tambahTahunAjaran } from '../actions';

export const dynamic = 'force-dynamic';

export default async function TahunAjaran() {
  await requireUser(['admin']);
  const data = await sql`select t.*, (select count(*)::int from kelas k where k.tahun_ajaran_id = t.id) as kelas from tahun_ajaran t order by t.nama desc, t.semester`;
  return (
    <>
      <Judul judul="Tahun Ajaran & Semester" sub="Kelas, jadwal, dan nilai mengikuti tahun ajaran yang aktif." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Kartu className="lg:col-span-2">
          <table className="tabel">
            <thead><tr><th>Tahun ajaran</th><th>Semester</th><th>Kelas</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {data.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium">{t.nama}</td><td>{t.semester}</td><td>{t.kelas}</td>
                  <td>{t.aktif ? <Lencana warna="hijau">Aktif</Lencana> : <Lencana>Tidak aktif</Lencana>}</td>
                  <td>{!t.aktif && (
                    <form action={aktifkanTahunAjaran}><input type="hidden" name="id" value={t.id} />
                      <TombolKirim className="btn-secondary btn-sm" konfirmasi="Ganti tahun ajaran aktif? Kelas dari tahun ajaran lain tidak akan tampil.">Aktifkan</TombolKirim>
                    </form>
                  )}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Kartu>
        <Kartu judul="Tambah">
          <form action={tambahTahunAjaran} className="space-y-3">
            <input name="nama" placeholder="2027/2028" className="input" required />
            <select name="semester" className="input"><option>Ganjil</option><option>Genap</option></select>
            <TombolKirim>Tambah</TombolKirim>
          </form>
        </Kartu>
      </div>
    </>
  );
}
