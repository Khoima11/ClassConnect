import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Judul, Kartu, Kosong, Lencana, TabelWadah, nilaiTampil } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { dataAbsensi, kelasRekap, matriksNilai } from '@/lib/rekap';
import { fmtTanggal, jam, tambahHari, todayWIB } from '@/lib/time';

export const dynamic = 'force-dynamic';

export default async function Rekap({ searchParams }: { searchParams: Promise<{ kelas?: string; tab?: string; dari?: string; sampai?: string }> }) {
  const user = await requireUser(['admin', 'kepala', 'guru']);
  const sp = await searchParams;
  const kelas = await kelasRekap(user);
  if (kelas.length === 0) redirect('/tidak-diizinkan');
  const kelasId = kelas.find((k) => k.id === Number(sp.kelas))?.id ?? kelas[0].id;
  const kelasNama = kelas.find((k) => k.id === kelasId)!.nama;
  const tab = sp.tab === 'nilai' ? 'nilai' : 'absensi';
  const hariIni = todayWIB();
  const tglOk = (t?: string) => (t && /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null);
  const dari = tglOk(sp.dari) ?? `${hariIni.slice(0, 8)}01`;
  const sampai = tglOk(sp.sampai) ?? hariIni;
  const bisaKoreksi = user.peran === 'admin' || user.peran === 'guru';
  const q = (o: Record<string, string>) => '?' + new URLSearchParams({ kelas: String(kelasId), tab, dari, sampai, ...o }).toString();

  return (
    <>
      <Judul
        judul={user.peran === 'guru' ? 'Kelas Saya' : 'Rekap Akademik'}
        sub={`Kelas ${kelasNama}`}
        aksi={
          kelas.length > 1 && (
            <form className="flex gap-2">
              <input type="hidden" name="tab" value={tab} />
              <select name="kelas" defaultValue={kelasId} className="input w-auto">{kelas.map((k) => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}</select>
              <button className="btn-secondary">Tampilkan</button>
            </form>
          )
        }
      />
      <div className="mb-4 flex gap-2">
        <Link href={q({ tab: 'absensi' })} className={tab === 'absensi' ? 'btn-primary' : 'btn-secondary'}>Absensi</Link>
        <Link href={q({ tab: 'nilai' })} className={tab === 'nilai' ? 'btn-primary' : 'btn-secondary'}>Nilai</Link>
      </div>
      {tab === 'absensi' ? <TabAbsensi kelasId={kelasId} dari={dari} sampai={sampai} bisaKoreksi={bisaKoreksi} /> : <TabNilai kelasId={kelasId} />}
    </>
  );
}

async function TabAbsensi({ kelasId, dari, sampai, bisaKoreksi }: { kelasId: number; dari: string; sampai: string; bisaKoreksi: boolean }) {
  const rows = await dataAbsensi(kelasId, dari, sampai);
  const pertemuan = bisaKoreksi
    ? await sql`
        select pt.tanggal, j.id as jadwal_id, j.jam_ke, j.jam_mulai, m.nama as mapel,
          count(a.*) filter (where a.status <> 'H')::int as tidak
        from pertemuan pt join jadwal j on j.id = pt.jadwal_id join pengampu p on p.id = j.pengampu_id join mapel m on m.id = p.mapel_id
        left join absensi a on a.pertemuan_id = pt.id
        where p.kelas_id = ${kelasId} and pt.tanggal between ${dari} and ${sampai}
        group by pt.tanggal, j.id, j.jam_ke, j.jam_mulai, m.nama order by pt.tanggal desc, j.jam_ke limit 60`
    : [];
  return (
    <>
      <Kartu
        judul="Rekap kehadiran per siswa"
        aksi={<a href={`/api/export?jenis=absensi&kelas=${kelasId}&dari=${dari}&sampai=${sampai}`} className="btn-secondary btn-sm">⬇ Unduh Excel (CSV)</a>}
      >
        <form className="mb-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="kelas" value={kelasId} />
          <input type="hidden" name="tab" value="absensi" />
          <label><span className="label">Dari</span><input type="date" name="dari" defaultValue={dari} className="input" /></label>
          <label><span className="label">Sampai</span><input type="date" name="sampai" defaultValue={sampai} className="input" /></label>
          <button className="btn-secondary">Terapkan</button>
          <Link className="btn-secondary" href={`?kelas=${kelasId}&tab=absensi&dari=${tambahHari(todayWIB(), -6)}&sampai=${todayWIB()}`}>7 hari terakhir</Link>
        </form>
        <TabelWadah>
          <table className="tabel">
            <thead><tr><th>Siswa</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alpa</th><th>Kehadiran</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{r.nama}</td><td>{r.h}</td><td>{r.s}</td><td>{r.i}</td>
                  <td>{r.a > 0 ? <Lencana warna="merah">{r.a}</Lencana> : 0}</td>
                  <td>{r.persen == null ? '-' : <Lencana warna={r.persen >= 90 ? 'hijau' : r.persen >= 75 ? 'kuning' : 'merah'}>{r.persen}%</Lencana>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TabelWadah>
      </Kartu>
      {bisaKoreksi && (
        <Kartu judul="Daftar pertemuan (koreksi absensi)" className="mt-4">
          {pertemuan.length === 0 ? <Kosong>Tidak ada pertemuan pada rentang ini.</Kosong> : (
            <TabelWadah>
              <table className="tabel">
                <thead><tr><th>Tanggal</th><th>Jam</th><th>Mapel</th><th>Tidak hadir</th><th></th></tr></thead>
                <tbody>
                  {pertemuan.map((p) => (
                    <tr key={`${p.tanggal}-${p.jadwal_id}`}>
                      <td className="whitespace-nowrap">{fmtTanggal(p.tanggal)}</td><td>Ke-{p.jam_ke} ({jam(p.jam_mulai)})</td><td>{p.mapel}</td><td>{p.tidak}</td>
                      <td><Link className="tautan" href={`/absensi/isi/${p.jadwal_id}?tanggal=${p.tanggal}`}>Lihat / koreksi</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabelWadah>
          )}
        </Kartu>
      )}
    </>
  );
}

async function TabNilai({ kelasId }: { kelasId: number }) {
  const { mapel, baris } = await matriksNilai(kelasId);
  return (
    <Kartu judul="Nilai akhir per mapel" aksi={<a href={`/api/export?jenis=nilai&kelas=${kelasId}`} className="btn-secondary btn-sm">⬇ Unduh Excel (CSV)</a>}>
      {baris.length === 0 ? <Kosong>Belum ada data.</Kosong> : (
        <>
          <TabelWadah>
            <table className="tabel">
              <thead>
                <tr>
                  <th>Siswa</th>
                  {mapel.map((p) => (
                    <th key={p.id}>
                      <Link href={`/nilai/${p.id}`} className="hover:underline">{p.mapel_nama}</Link>
                      {!p.nilai_terbit && <span className="block text-[10px] font-normal text-amber-600">draf</span>}
                    </th>
                  ))}
                  <th>Rata-rata</th>
                </tr>
              </thead>
              <tbody>
                {baris.map((b) => (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap font-medium">{b.nama}</td>
                    {b.nilai.map((n, i) => <td key={i} className={n != null && n < 70 ? 'text-red-600' : ''}>{nilaiTampil(n)}</td>)}
                    <td className="font-semibold">{nilaiTampil(b.rata)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabelWadah>
          <p className="mt-3 text-xs text-slate-500">Nilai di bawah 70 ditandai merah. Klik nama mapel untuk melihat rincian komponen. Rekap ini tidak menggantikan rapor resmi (RDM).</p>
        </>
      )}
    </Kartu>
  );
}
