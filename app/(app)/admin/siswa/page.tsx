import { TombolKirim } from '@/components/client';
import { Bidang, Judul, Kartu, Kosong, Lencana, TabelWadah } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { semuaKelas } from '@/lib/data';
import { sql } from '@/lib/db';
import { aturAktif, pindahKelas, resetSandi, tambahSiswa } from '../actions';

export const dynamic = 'force-dynamic';

export default async function DataSiswa({ searchParams }: { searchParams: Promise<{ kelas?: string; q?: string }> }) {
  await requireUser(['admin']);
  const sp = await searchParams;
  const kelas = await semuaKelas();
  const kelasId = sp.kelas === 'tanpa' ? -1 : Number(sp.kelas) || null;
  const q = (sp.q ?? '').trim();
  const data = await sql`
    select u.id, u.nama, u.username, u.aktif, s.nisn, s.jenis_kelamin, s.kelas_id, k.nama as kelas,
      (select string_agg(o.nama, ', ') from ortu_siswa os join users o on o.id = os.ortu_id where os.siswa_id = u.id) as ortu
    from siswa s join users u on u.id = s.user_id left join kelas k on k.id = s.kelas_id
    where (${kelasId}::int is null or (${kelasId} = -1 and s.kelas_id is null) or s.kelas_id = ${kelasId})
      and (${q} = '' or u.nama ilike ${'%' + q + '%'} or s.nisn like ${'%' + q + '%'})
    order by k.nama nulls first, u.nama`;
  const kembaliKe = `/admin/siswa?kelas=${sp.kelas ?? ''}&q=${encodeURIComponent(q)}`;
  return (
    <>
      <Judul judul="Data Siswa" sub={`${data.length} siswa ditampilkan`} />
      <details className="card mb-4">
        <summary className="cursor-pointer font-semibold text-navy-900">+ Tambah siswa</summary>
        <form action={tambahSiswa} className="mt-4 grid gap-3 sm:grid-cols-3">
          <Bidang label="Nama lengkap"><input name="nama" className="input" required /></Bidang>
          <Bidang label="NISN"><input name="nisn" className="input" inputMode="numeric" required /></Bidang>
          <Bidang label="Username" ket="Kosongkan = NISN"><input name="username" className="input" /></Bidang>
          <Bidang label="Jenis kelamin"><select name="jk" className="input"><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></Bidang>
          <Bidang label="Kelas"><select name="kelas_id" className="input">{kelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}</select></Bidang>
          <div />
          <Bidang label="Nama orang tua (opsional)" ket="Akun ortu dibuat dengan username ortu+NISN"><input name="nama_ortu" className="input" /></Bidang>
          <Bidang label="Hubungan"><select name="hubungan" className="input"><option>Ayah</option><option>Ibu</option><option>Wali</option></select></Bidang>
          <Bidang label="No. HP orang tua"><input name="hp_ortu" className="input" /></Bidang>
          <div className="sm:col-span-3"><TombolKirim>Simpan Siswa</TombolKirim></div>
        </form>
      </details>
      <Kartu>
        <form className="mb-4 flex flex-wrap gap-2">
          <select name="kelas" defaultValue={sp.kelas ?? ''} className="input w-auto">
            <option value="">Semua kelas</option>
            {kelas.map((k) => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}
            <option value="tanpa">Belum punya kelas</option>
          </select>
          <input name="q" defaultValue={q} placeholder="Cari nama / NISN" className="input w-auto" />
          <button className="btn-secondary">Cari</button>
        </form>
        {data.length === 0 ? <Kosong>Tidak ada siswa.</Kosong> : (
          <TabelWadah>
            <table className="tabel">
              <thead><tr><th>Nama</th><th>NISN / username</th><th>Kelas</th><th>Orang tua</th><th>Aksi</th></tr></thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id} className={s.aktif ? '' : 'opacity-50'}>
                    <td className="font-medium">{s.nama} {!s.aktif && <Lencana warna="merah">Nonaktif</Lencana>}<p className="text-xs font-normal text-slate-400">{s.jenis_kelamin === 'P' ? 'Perempuan' : 'Laki-laki'}</p></td>
                    <td className="text-xs">{s.nisn}<br /><span className="text-slate-400">{s.username}</span></td>
                    <td>
                      <form action={pindahKelas} className="flex gap-1">
                        <input type="hidden" name="id" value={s.id} /><input type="hidden" name="kembali" value={kembaliKe} />
                        <select name="kelas_id" defaultValue={s.kelas_id ?? ''} className="input w-24 py-1 text-xs">
                          <option value="">-</option>{kelas.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
                        </select>
                        <TombolKirim className="btn-secondary btn-sm">✓</TombolKirim>
                      </form>
                    </td>
                    <td className="text-xs">{s.ortu ?? <span className="text-amber-600">Belum ada</span>}</td>
                    <td>
                      <div className="flex gap-1">
                        <form action={resetSandi}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="kembali" value={kembaliKe} /><TombolKirim className="btn-secondary btn-sm" konfirmasi={`Reset kata sandi ${s.nama}?`}>Reset sandi</TombolKirim></form>
                        <form action={aturAktif}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="kembali" value={kembaliKe} /><TombolKirim className="btn-secondary btn-sm">{s.aktif ? 'Nonaktifkan' : 'Aktifkan'}</TombolKirim></form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabelWadah>
        )}
      </Kartu>
    </>
  );
}
