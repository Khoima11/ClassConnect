import Link from 'next/link';
import { Judul, Kartu, Kosong, Lencana, TabelWadah } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { kelasMilik, pengampuGuru, semuaKelas, siswaMilik } from '@/lib/data';
import { sql } from '@/lib/db';
import { fmtWaktu } from '@/lib/time';

export const dynamic = 'force-dynamic';

function Tenggat({ t }: { t: Date }) {
  const lewat = new Date(t) < new Date();
  return <span className={lewat ? 'text-red-600' : ''}>{fmtWaktu(t)}</span>;
}

export default async function HalamanTugas({ searchParams }: { searchParams: Promise<{ p?: string; kelas?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;

  if (user.peran === 'guru') {
    const daftar = await pengampuGuru(user.id);
    const pilih = Number(sp.p) || null;
    const tugas = await sql`
      select t.id, t.judul, t.tenggat, t.boleh_terlambat, m.nama as mapel, k.nama as kelas,
        (select count(*)::int from siswa s where s.kelas_id = p.kelas_id) as jumlah_siswa,
        count(pg.id)::int as terkumpul, count(pg.id) filter (where pg.nilai is null)::int as belum_dinilai
      from tugas t join pengampu p on p.id = t.pengampu_id join mapel m on m.id = p.mapel_id join kelas k on k.id = p.kelas_id
      left join pengumpulan pg on pg.tugas_id = t.id
      where p.guru_id = ${user.id} ${pilih ? sql`and p.id = ${pilih}` : sql``}
      group by t.id, m.nama, k.nama, p.kelas_id order by t.tenggat desc`;
    const wali = user.waliKelas.length
      ? await sql`
          select t.id, t.judul, t.tenggat, m.nama as mapel, k.nama as kelas,
            (select count(*)::int from siswa s where s.kelas_id = p.kelas_id) as jumlah_siswa, count(pg.id)::int as terkumpul
          from tugas t join pengampu p on p.id = t.pengampu_id join mapel m on m.id = p.mapel_id join kelas k on k.id = p.kelas_id
          left join pengumpulan pg on pg.tugas_id = t.id
          where p.kelas_id in ${sql(user.waliKelas.map((k) => k.id))} and p.guru_id <> ${user.id}
          group by t.id, m.nama, k.nama, p.kelas_id order by t.tenggat desc limit 20`
      : [];
    return (
      <>
        <Judul
          judul="Tugas"
          sub="Tugas yang Anda berikan"
          aksi={
            <>
              <form className="flex gap-2">
                <select name="p" defaultValue={pilih ?? ''} className="input w-auto">
                  <option value="">Semua kelas & mapel</option>
                  {daftar.map((p) => <option key={p.id} value={p.id}>{p.mapel_nama} · {p.kelas_nama}</option>)}
                </select>
                <button className="btn-secondary">Saring</button>
              </form>
              <Link href="/tugas/baru" className="btn-primary">+ Buat Tugas</Link>
            </>
          }
        />
        <Kartu>
          {tugas.length === 0 ? <Kosong>Belum ada tugas.</Kosong> : (
            <TabelWadah>
              <table className="tabel">
                <thead><tr><th>Tugas</th><th>Kelas</th><th>Tenggat</th><th>Terkumpul</th><th>Status</th></tr></thead>
                <tbody>
                  {tugas.map((t) => (
                    <tr key={t.id}>
                      <td><Link href={`/tugas/${t.id}`} className="tautan">{t.judul}</Link><p className="text-xs text-slate-500">{t.mapel}</p></td>
                      <td>{t.kelas}</td>
                      <td className="whitespace-nowrap"><Tenggat t={t.tenggat} /></td>
                      <td>{t.terkumpul}/{t.jumlah_siswa}</td>
                      <td>{t.belum_dinilai > 0 ? <Lencana warna="kuning">{t.belum_dinilai} belum dinilai</Lencana> : <Lencana warna="hijau">Beres</Lencana>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabelWadah>
          )}
        </Kartu>
        {wali.length > 0 && (
          <Kartu judul={`Tugas mapel lain di kelas perwalian (${user.waliKelas.map((k) => k.nama).join(', ')})`} className="mt-4">
            <TabelWadah>
              <table className="tabel">
                <thead><tr><th>Tugas</th><th>Mapel</th><th>Tenggat</th><th>Terkumpul</th></tr></thead>
                <tbody>{wali.map((t) => (
                  <tr key={t.id}><td><Link className="tautan" href={`/tugas/${t.id}`}>{t.judul}</Link></td><td>{t.mapel}</td><td><Tenggat t={t.tenggat} /></td><td>{t.terkumpul}/{t.jumlah_siswa}</td></tr>
                ))}</tbody>
              </table>
            </TabelWadah>
          </Kartu>
        )}
      </>
    );
  }

  if (user.peran === 'admin' || user.peran === 'kepala') {
    const kelas = await semuaKelas();
    const kelasId = Number(sp.kelas) || kelas[0]?.id;
    const tugas = await sql`
      select t.id, t.judul, t.tenggat, m.nama as mapel, g.nama as guru,
        (select count(*)::int from siswa s where s.kelas_id = p.kelas_id) as jumlah_siswa, count(pg.id)::int as terkumpul
      from tugas t join pengampu p on p.id = t.pengampu_id join mapel m on m.id = p.mapel_id join users g on g.id = p.guru_id
      left join pengumpulan pg on pg.tugas_id = t.id
      where p.kelas_id = ${kelasId ?? -1}
      group by t.id, m.nama, g.nama, p.kelas_id order by t.tenggat desc`;
    return (
      <>
        <Judul judul="Ringkasan Tugas" aksi={
          <form className="flex gap-2">
            <select name="kelas" defaultValue={kelasId} className="input w-auto">{kelas.map((k) => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}</select>
            <button className="btn-secondary">Tampilkan</button>
          </form>
        } />
        <Kartu>
          {tugas.length === 0 ? <Kosong>Belum ada tugas.</Kosong> : (
            <TabelWadah><table className="tabel">
              <thead><tr><th>Tugas</th><th>Mapel</th><th>Guru</th><th>Tenggat</th><th>Terkumpul</th></tr></thead>
              <tbody>{tugas.map((t) => (
                <tr key={t.id}><td><Link href={`/tugas/${t.id}`} className="tautan">{t.judul}</Link></td><td>{t.mapel}</td><td>{t.guru}</td><td className="whitespace-nowrap"><Tenggat t={t.tenggat} /></td><td>{t.terkumpul}/{t.jumlah_siswa}</td></tr>
              ))}</tbody>
            </table></TabelWadah>
          )}
        </Kartu>
      </>
    );
  }

  // Siswa dan orang tua
  const siswaId = siswaMilik(user);
  const kelasId = kelasMilik(user);
  if (!siswaId || !kelasId) return <Kosong>Data kelas belum terhubung.</Kosong>;
  const tugas = await sql`
    select t.id, t.judul, t.tenggat, t.boleh_terlambat, m.nama as mapel, p.nilai_terbit,
      pg.dikirim_pada, pg.terlambat, pg.nilai
    from tugas t join pengampu p on p.id = t.pengampu_id join mapel m on m.id = p.mapel_id
    left join pengumpulan pg on pg.tugas_id = t.id and pg.siswa_id = ${siswaId}
    where p.kelas_id = ${kelasId}
    order by (pg.id is null and t.tenggat > now()) desc, t.tenggat desc`;
  const status = (t: any) => {
    if (t.dikirim_pada) {
      if (t.nilai != null && t.nilai_terbit) return <Lencana warna="hijau">Dinilai: {t.nilai}</Lencana>;
      return <Lencana warna={t.terlambat ? 'kuning' : 'biru'}>{t.terlambat ? 'Terkumpul (terlambat)' : 'Sudah dikumpulkan'}</Lencana>;
    }
    if (new Date(t.tenggat) < new Date()) return <Lencana warna="merah">{t.boleh_terlambat ? 'Belum (lewat tenggat)' : 'Tidak dikumpulkan'}</Lencana>;
    return <Lencana warna="abu">Belum dikumpulkan</Lencana>;
  };
  return (
    <>
      <Judul judul={user.peran === 'ortu' ? `Tugas ${user.anakAktif?.nama}` : 'Tugas Saya'} sub={`${tugas.filter((t) => !t.dikirim_pada && new Date(t.tenggat) > new Date()).length} tugas menunggu dikumpulkan`} />
      <Kartu>
        {tugas.length === 0 ? <Kosong>Belum ada tugas.</Kosong> : (
          <ul className="divide-y divide-slate-100">
            {tugas.map((t) => (
              <li key={t.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href={`/tugas/${t.id}`} className="tautan">{t.judul}</Link>
                  <p className="text-xs text-slate-500">{t.mapel} · Tenggat <Tenggat t={t.tenggat} /></p>
                </div>
                {status(t)}
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </>
  );
}
