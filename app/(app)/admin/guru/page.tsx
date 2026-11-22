import { TombolKirim } from '@/components/client';
import { Bidang, Judul, Kartu, Lencana, TabelWadah } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { aturAktif, resetSandi, tambahGuru } from '../actions';

export const dynamic = 'force-dynamic';

export default async function DataGuru() {
  await requireUser(['admin']);
  const data = await sql`
    select u.id, u.nama, u.username, u.no_hp, u.aktif, g.nip,
      (select string_agg(distinct m.nama, ', ') from pengampu p join mapel m on m.id = p.mapel_id where p.guru_id = u.id) as mapel,
      (select string_agg(k.nama, ', ') from kelas k where k.wali_kelas_id = u.id) as wali
    from guru g join users u on u.id = g.user_id order by u.nama`;
  const staf = await sql`select id, nama, username, peran, aktif from users where peran in ('admin', 'kepala') order by peran, nama`;
  return (
    <>
      <Judul judul="Data Guru" sub={`${data.length} guru`} />
      <details className="card mb-4">
        <summary className="cursor-pointer font-semibold text-navy-900">+ Tambah guru</summary>
        <form action={tambahGuru} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Bidang label="Nama lengkap & gelar"><input name="nama" className="input" required /></Bidang>
          <Bidang label="Username"><input name="username" className="input" required /></Bidang>
          <Bidang label="NIP / kode guru"><input name="nip" className="input" /></Bidang>
          <Bidang label="No. HP"><input name="no_hp" className="input" /></Bidang>
          <div className="sm:col-span-2"><TombolKirim>Simpan Guru</TombolKirim></div>
        </form>
      </details>
      <Kartu>
        <TabelWadah>
          <table className="tabel">
            <thead><tr><th>Nama</th><th>Username / NIP</th><th>Mengajar</th><th>Wali kelas</th><th>Aksi</th></tr></thead>
            <tbody>
              {data.map((g) => (
                <tr key={g.id} className={g.aktif ? '' : 'opacity-50'}>
                  <td className="font-medium">{g.nama} {!g.aktif && <Lencana warna="merah">Nonaktif</Lencana>}<p className="text-xs font-normal text-slate-400">{g.no_hp ?? ''}</p></td>
                  <td className="text-xs">{g.username}<br /><span className="text-slate-400">{g.nip ?? '-'}</span></td>
                  <td className="text-xs">{g.mapel ?? '-'}</td>
                  <td>{g.wali ?? '-'}</td>
                  <td>
                    <div className="flex gap-1">
                      <form action={resetSandi}><input type="hidden" name="id" value={g.id} /><input type="hidden" name="kembali" value="/admin/guru" /><TombolKirim className="btn-secondary btn-sm" konfirmasi={`Reset kata sandi ${g.nama}?`}>Reset sandi</TombolKirim></form>
                      <form action={aturAktif}><input type="hidden" name="id" value={g.id} /><input type="hidden" name="kembali" value="/admin/guru" /><TombolKirim className="btn-secondary btn-sm">{g.aktif ? 'Nonaktifkan' : 'Aktifkan'}</TombolKirim></form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabelWadah>
      </Kartu>
      <Kartu judul="Akun admin & kepala madrasah" className="mt-4">
        <table className="tabel">
          <thead><tr><th>Nama</th><th>Username</th><th>Peran</th><th></th></tr></thead>
          <tbody>{staf.map((s) => (
            <tr key={s.id}><td>{s.nama}</td><td>{s.username}</td><td>{s.peran === 'admin' ? 'Admin' : 'Kepala Madrasah'}</td>
              <td><form action={resetSandi}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="kembali" value="/admin/guru" /><TombolKirim className="btn-secondary btn-sm" konfirmasi={`Reset kata sandi ${s.nama}?`}>Reset sandi</TombolKirim></form></td></tr>
          ))}</tbody>
        </table>
      </Kartu>
    </>
  );
}
