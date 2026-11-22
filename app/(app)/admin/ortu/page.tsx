import { TombolKirim } from '@/components/client';
import { Bidang, Judul, Kartu, TabelWadah } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { lepasOrtu, resetSandi, tambahOrtu } from '../actions';

export const dynamic = 'force-dynamic';

export default async function DataOrtu() {
  await requireUser(['admin']);
  const data = await sql`
    select o.id, o.nama, o.username, o.no_hp, os.siswa_id, os.hubungan, s.nama as siswa, k.nama as kelas
    from users o left join ortu_siswa os on os.ortu_id = o.id left join users s on s.id = os.siswa_id
    left join siswa sw on sw.user_id = s.id left join kelas k on k.id = sw.kelas_id
    where o.peran = 'ortu' order by o.nama`;
  const siswa = await sql`select u.id, u.nama, k.nama as kelas from siswa s join users u on u.id = s.user_id left join kelas k on k.id = s.kelas_id order by k.nama, u.nama`;
  const ortu = await sql`select id, nama, username from users where peran = 'ortu' order by nama`;
  return (
    <>
      <Judul judul="Data Orang Tua" sub="Satu akun orang tua bisa terhubung ke lebih dari satu anak." />
      <details className="card mb-4">
        <summary className="cursor-pointer font-semibold text-navy-900">+ Hubungkan orang tua dengan siswa</summary>
        <form action={tambahOrtu} className="mt-4 grid gap-3 sm:grid-cols-2">
          <Bidang label="Siswa"><select name="siswa_id" className="input" required>{siswa.map((s) => <option key={s.id} value={s.id}>{s.nama} ({s.kelas ?? '-'})</option>)}</select></Bidang>
          <Bidang label="Hubungan"><select name="hubungan" className="input"><option>Ayah</option><option>Ibu</option><option>Wali</option></select></Bidang>
          <Bidang label="Pakai akun orang tua yang sudah ada" ket="Pilih jika kakak/adiknya sudah terdaftar">
            <select name="ortu_id" className="input"><option value="">- Buat akun baru -</option>{ortu.map((o) => <option key={o.id} value={o.id}>{o.nama} ({o.username})</option>)}</select>
          </Bidang>
          <div />
          <Bidang label="Nama (akun baru)"><input name="nama" className="input" /></Bidang>
          <Bidang label="Username (akun baru)"><input name="username" className="input" /></Bidang>
          <Bidang label="No. HP (akun baru)"><input name="no_hp" className="input" /></Bidang>
          <div className="sm:col-span-2"><TombolKirim>Simpan</TombolKirim></div>
        </form>
      </details>
      <Kartu>
        <TabelWadah>
          <table className="tabel">
            <thead><tr><th>Orang tua</th><th>Username</th><th>Anak</th><th>Aksi</th></tr></thead>
            <tbody>
              {data.map((o, i) => (
                <tr key={`${o.id}-${o.siswa_id ?? i}`}>
                  <td className="font-medium">{o.nama}<p className="text-xs font-normal text-slate-400">{o.no_hp ?? ''}</p></td>
                  <td className="text-xs">{o.username}</td>
                  <td>{o.siswa ? `${o.siswa} (${o.kelas ?? '-'}) · ${o.hubungan}` : <span className="text-amber-600">Belum terhubung</span>}</td>
                  <td>
                    <div className="flex gap-1">
                      <form action={resetSandi}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="kembali" value="/admin/ortu" /><TombolKirim className="btn-secondary btn-sm" konfirmasi={`Reset kata sandi ${o.nama}?`}>Reset sandi</TombolKirim></form>
                      {o.siswa_id && <form action={lepasOrtu}><input type="hidden" name="ortu_id" value={o.id} /><input type="hidden" name="siswa_id" value={o.siswa_id} /><TombolKirim className="btn-secondary btn-sm" konfirmasi="Lepas hubungan ini?">Lepas</TombolKirim></form>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabelWadah>
      </Kartu>
    </>
  );
}
