import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Judul, Kartu, Kosong, LencanaAbsen, Statistik, TabelWadah } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { persen, siswaMilik } from '@/lib/data';
import { sql } from '@/lib/db';
import { NAMA_HARI, fmtTanggal, hariDari, jam, tambahHari, todayWIB } from '@/lib/time';

export const dynamic = 'force-dynamic';

export default async function HalamanAbsensi({ searchParams }: { searchParams: Promise<{ bulan?: string }> }) {
  const user = await requireUser();
  if (user.peran === 'admin' || user.peran === 'kepala') redirect('/rekap');
  const hariIni = todayWIB();

  if (user.peran === 'guru') {
    const hari = hariDari(hariIni);
    const hariIniJadwal = await sql`
      select j.id, j.jam_ke, j.jam_mulai, j.jam_selesai, m.nama as mapel, k.nama as kelas,
        exists (select 1 from pertemuan pt where pt.jadwal_id = j.id and pt.tanggal = ${hariIni}) as sudah
      from jadwal j join pengampu p on p.id = j.pengampu_id join mapel m on m.id = p.mapel_id join kelas k on k.id = p.kelas_id
      where p.guru_id = ${user.id} and j.hari = ${hari} order by j.jam_ke`;
    const riwayat = await sql`
      select pt.tanggal, j.id as jadwal_id, j.jam_ke, m.nama as mapel, k.nama as kelas,
        count(a.*) filter (where a.status = 'H')::int as h, count(a.*) filter (where a.status <> 'H')::int as tidak
      from pertemuan pt join jadwal j on j.id = pt.jadwal_id join pengampu p on p.id = j.pengampu_id
      join mapel m on m.id = p.mapel_id join kelas k on k.id = p.kelas_id left join absensi a on a.pertemuan_id = pt.id
      where p.guru_id = ${user.id} and pt.tanggal >= ${tambahHari(hariIni, -14)}
      group by pt.tanggal, j.id, j.jam_ke, m.nama, k.nama order by pt.tanggal desc, j.jam_ke limit 40`;
    return (
      <>
        <Judul judul="Absensi" sub={`Hari ini: ${fmtTanggal(hariIni)}`} aksi={user.waliKelas.length > 0 && <Link href="/rekap" className="btn-secondary">Rekap kelas saya</Link>} />
        <div className="grid gap-4 lg:grid-cols-2">
          <Kartu judul="Pertemuan hari ini">
            {hariIniJadwal.length === 0 ? <Kosong>Tidak ada jadwal mengajar hari ini ({NAMA_HARI[hari]}).</Kosong> : (
              <ul className="divide-y divide-slate-100">
                {hariIniJadwal.map((j) => (
                  <li key={j.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{j.mapel} · {j.kelas}</p>
                      <p className="text-xs text-slate-500">Jam ke-{j.jam_ke} · {jam(j.jam_mulai)}–{jam(j.jam_selesai)}</p>
                    </div>
                    <Link href={`/absensi/isi/${j.id}`} className={j.sudah ? 'btn-secondary btn-sm' : 'btn-hijau btn-sm'}>{j.sudah ? 'Ubah' : 'Isi Absensi'}</Link>
                  </li>
                ))}
              </ul>
            )}
          </Kartu>
          <Kartu judul="Riwayat 2 minggu terakhir">
            {riwayat.length === 0 ? <Kosong>Belum ada pertemuan.</Kosong> : (
              <TabelWadah>
                <table className="tabel">
                  <thead><tr><th>Tanggal</th><th>Mapel</th><th>Hadir</th><th>Tidak hadir</th></tr></thead>
                  <tbody>
                    {riwayat.map((r) => (
                      <tr key={`${r.tanggal}-${r.jadwal_id}`}>
                        <td className="whitespace-nowrap"><Link className="tautan" href={`/absensi/isi/${r.jadwal_id}?tanggal=${r.tanggal}`}>{fmtTanggal(r.tanggal)}</Link></td>
                        <td>{r.mapel} · {r.kelas}</td>
                        <td>{r.h}</td>
                        <td>{r.tidak}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TabelWadah>
            )}
          </Kartu>
        </div>
      </>
    );
  }

  // Siswa dan orang tua: riwayat kehadiran (KF-16)
  const siswaId = siswaMilik(user);
  if (!siswaId) return <Kosong>Data siswa belum terhubung.</Kosong>;
  const sp = await searchParams;
  const bulan = sp.bulan && /^\d{4}-\d{2}$/.test(sp.bulan) ? sp.bulan : hariIni.slice(0, 7);
  const dari = `${bulan}-01`;
  const sampai = tambahHari(tambahHari(dari, 32).slice(0, 7) + '-01', -1);

  const data = await sql`
    select pt.tanggal, j.jam_ke, m.nama as mapel, a.status, a.keterangan
    from absensi a join pertemuan pt on pt.id = a.pertemuan_id join jadwal j on j.id = pt.jadwal_id
    join pengampu p on p.id = j.pengampu_id join mapel m on m.id = p.mapel_id
    where a.siswa_id = ${siswaId} and pt.tanggal between ${dari} and ${sampai}
    order by pt.tanggal desc, j.jam_ke`;
  const hitung = (s: string) => data.filter((d) => d.status === s).length;
  const pilihanBulan = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hariIni + 'T00:00:00Z');
    d.setUTCMonth(d.getUTCMonth() - i, 1);
    return d.toISOString().slice(0, 7);
  });
  const namaBulan = (b: string) => new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(b + '-01T00:00:00Z'));

  return (
    <>
      <Judul
        judul={user.peran === 'ortu' ? `Absensi ${user.anakAktif?.nama}` : 'Absensi Saya'}
        sub={namaBulan(bulan)}
        aksi={
          <form className="flex gap-2">
            <select name="bulan" defaultValue={bulan} className="input w-auto">
              {pilihanBulan.map((b) => <option key={b} value={b}>{namaBulan(b)}</option>)}
            </select>
            <button className="btn-secondary">Tampilkan</button>
          </form>
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        <Statistik label="Kehadiran" nilai={persen(hitung('H'), data.length) == null ? '-' : `${persen(hitung('H'), data.length)}%`} ket={`${data.length} pertemuan`} />
        <Statistik label="Hadir" nilai={hitung('H')} />
        <Statistik label="Sakit" nilai={hitung('S')} />
        <Statistik label="Izin" nilai={hitung('I')} />
        <Statistik label="Alpa" nilai={hitung('A')} />
      </div>
      <Kartu judul="Riwayat per pertemuan">
        {data.length === 0 ? <Kosong>Belum ada data absensi bulan ini.</Kosong> : (
          <TabelWadah>
            <table className="tabel">
              <thead><tr><th>Tanggal</th><th>Jam</th><th>Mapel</th><th>Status</th><th>Keterangan</th></tr></thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={i}>
                    <td className="whitespace-nowrap">{fmtTanggal(d.tanggal)}</td>
                    <td>Ke-{d.jam_ke}</td>
                    <td>{d.mapel}</td>
                    <td><LencanaAbsen status={d.status} /></td>
                    <td className="text-slate-500">{d.keterangan ?? '-'}</td>
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
