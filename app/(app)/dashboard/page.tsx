import Link from 'next/link';
import { Judul, Kartu, Kosong, Lencana, Statistik, nilaiTampil } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { filterPengumuman, persen, semuaKelas, tahunAktif } from '@/lib/data';
import { sql } from '@/lib/db';
import { NAMA_HARI, fmtSingkat, fmtTanggal, hariDari, jam, tambahHari, todayWIB } from '@/lib/time';
import type { CurrentUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function pengumumanTerbaru(user: CurrentUser) {
  return sql`
    select pg.id, pg.judul, pg.dibuat, pg.disematkan,
      exists (select 1 from pengumuman_dibaca d where d.pengumuman_id = pg.id and d.user_id = ${user.id}) as dibaca
    from pengumuman pg
    where ${filterPengumuman(user)}
    order by pg.disematkan desc, pg.dibuat desc limit 4`;
}

function DaftarPengumuman({ data }: { data: any[] }) {
  if (data.length === 0) return <Kosong>Belum ada pengumuman.</Kosong>;
  return (
    <ul className="divide-y divide-slate-100">
      {data.map((p) => (
        <li key={p.id} className="flex items-start justify-between gap-2 py-2">
          <Link href={`/pengumuman/${p.id}`} className="tautan text-sm">
            {p.disematkan && '📌 '}
            {p.judul}
          </Link>
          <span className="shrink-0 text-xs text-slate-400">{!p.dibaca && <Lencana warna="biru">Baru</Lencana>}</span>
        </li>
      ))}
    </ul>
  );
}

async function jadwalHariIni(filter: { kelasId?: number; guruId?: number }) {
  const hari = hariDari(todayWIB());
  if (hari === 7) return { hari, data: [] as any[] };
  const data = await sql`
    select j.id, j.jam_ke, j.jam_mulai, j.jam_selesai, m.nama as mapel, k.nama as kelas, g.nama as guru,
      exists (select 1 from pertemuan pt where pt.jadwal_id = j.id and pt.tanggal = ${todayWIB()}) as sudah_absen
    from jadwal j
    join pengampu p on p.id = j.pengampu_id
    join mapel m on m.id = p.mapel_id
    join kelas k on k.id = p.kelas_id
    join users g on g.id = p.guru_id
    where j.hari = ${hari}
      and (${filter.kelasId ?? null}::int is null or p.kelas_id = ${filter.kelasId ?? null})
      and (${filter.guruId ?? null}::int is null or p.guru_id = ${filter.guruId ?? null})
    order by j.jam_ke`;
  return { hari, data };
}

function KartuJadwal({ judul, hari, data, guru }: { judul: string; hari: number; data: any[]; guru?: boolean }) {
  return (
    <Kartu judul={judul} aksi={<Link href="/jadwal" className="tautan text-xs">Semua jadwal</Link>}>
      {data.length === 0 ? (
        <Kosong>{hari === 7 ? 'Hari Minggu, tidak ada jadwal.' : 'Tidak ada jadwal hari ini.'}</Kosong>
      ) : (
        <ul className="divide-y divide-slate-100">
          {data.map((j) => (
            <li key={j.id} className="flex items-center justify-between gap-3 py-2">
              <div>
                <p className="text-sm font-medium">{j.mapel} {guru && <span className="text-slate-500">· {j.kelas}</span>}</p>
                <p className="text-xs text-slate-500">
                  Jam ke-{j.jam_ke} · {jam(j.jam_mulai)}–{jam(j.jam_selesai)} {!guru && `· ${j.guru}`}
                </p>
              </div>
              {guru &&
                (j.sudah_absen ? (
                  <Link href={`/absensi/isi/${j.id}`} className="btn-secondary btn-sm">✓ Sudah diabsen</Link>
                ) : (
                  <Link href={`/absensi/isi/${j.id}`} className="btn-hijau btn-sm">Isi Absensi</Link>
                ))}
            </li>
          ))}
        </ul>
      )}
    </Kartu>
  );
}

async function DashAdmin({ user }: { user: CurrentUser }) {
  const [c] = await sql`select
    (select count(*)::int from siswa) as siswa,
    (select count(*)::int from guru) as guru,
    (select count(*)::int from users where peran = 'ortu') as ortu,
    (select count(*)::int from pengumuman where tayang_mulai <= now() and (tayang_akhir is null or tayang_akhir >= now())) as pengumuman,
    (select count(*)::int from pesan_diskusi where dilaporkan and not dihapus) + (select count(*)::int from pesan_langsung where dilaporkan) as laporan`;
  const kelas = await semuaKelas();
  const lengkap = await sql`
    select k.id, count(distinct p.id)::int as mapel, count(j.id)::int as jam,
      count(distinct p.id) filter (where j.id is null)::int as tanpa_jadwal
    from kelas k left join pengampu p on p.kelas_id = k.id left join jadwal j on j.pengampu_id = p.id
    group by k.id`;
  const ta = await tahunAktif();
  return (
    <>
      <Judul judul={`Selamat datang, ${user.nama}`} sub={`Tahun ajaran ${ta?.nama ?? '-'} semester ${ta?.semester ?? '-'}`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Statistik label="Siswa" nilai={c.siswa} href="/admin/siswa" />
        <Statistik label="Guru" nilai={c.guru} href="/admin/guru" />
        <Statistik label="Kelas" nilai={kelas.length} href="/admin/kelas" />
        <Statistik label="Pengumuman aktif" nilai={c.pengumuman} href="/pengumuman" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Kartu judul="Kelengkapan jadwal" aksi={<Link href="/admin/jadwal" className="tautan text-xs">Kelola jadwal</Link>}>
          <table className="tabel">
            <thead><tr><th>Kelas</th><th>Wali kelas</th><th>Mapel</th><th>Pertemuan/minggu</th><th>Status</th></tr></thead>
            <tbody>
              {kelas.map((k) => {
                const l = lengkap.find((x) => x.id === k.id);
                return (
                  <tr key={k.id}>
                    <td className="font-medium">{k.nama}</td>
                    <td>{k.wali_nama ?? '-'}</td>
                    <td>{l?.mapel ?? 0}</td>
                    <td>{l?.jam ?? 0}</td>
                    <td>{l && l.tanpa_jadwal === 0 && l.mapel > 0 ? <Lencana warna="hijau">Lengkap</Lencana> : <Lencana warna="kuning">{l?.tanpa_jadwal ?? 0} mapel belum dijadwalkan</Lencana>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Kartu>
        <Kartu judul="Pintasan">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link className="btn-secondary" href="/admin/siswa">Data siswa</Link>
            <Link className="btn-secondary" href="/admin/impor">Impor data</Link>
            <Link className="btn-secondary" href="/pengumuman/baru">Buat pengumuman</Link>
            <Link className="btn-secondary" href="/admin/laporan">Laporan pesan ({c.laporan})</Link>
            <Link className="btn-secondary" href="/admin/bobot">Bobot nilai</Link>
            <Link className="btn-secondary" href="/admin/reset">Reset data demo</Link>
          </div>
        </Kartu>
      </div>
    </>
  );
}

async function DashKepala({ user }: { user: CurrentUser }) {
  const hari = todayWIB();
  const dari = tambahHari(hari, -6);
  const perKelas = await sql`
    select k.id, k.nama,
      count(a.*) filter (where a.status = 'H')::int as h, count(a.*)::int as total,
      count(a.*) filter (where a.status = 'A')::int as alpa
    from kelas k
    left join pengampu p on p.kelas_id = k.id
    left join jadwal j on j.pengampu_id = p.id
    left join pertemuan pt on pt.jadwal_id = j.id and pt.tanggal between ${dari} and ${hari}
    left join absensi a on a.pertemuan_id = pt.id
    group by k.id, k.nama order by k.nama`;
  const alpa = await sql`
    select u.nama, k.nama as kelas, count(*)::int as n
    from absensi a join pertemuan pt on pt.id = a.pertemuan_id
    join users u on u.id = a.siswa_id join siswa s on s.user_id = u.id join kelas k on k.id = s.kelas_id
    where a.status = 'A' and pt.tanggal >= ${tambahHari(hari, -30)}
    group by u.nama, k.nama order by n desc, u.nama limit 5`;
  const peng = await pengumumanTerbaru(user);
  return (
    <>
      <Judul judul={`Assalamualaikum, ${user.nama}`} sub={`Ringkasan madrasah · ${fmtTanggal(hari)}`} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {perKelas.map((k) => (
          <Statistik key={k.id} label={`Kehadiran ${k.nama} (7 hari)`} nilai={persen(k.h, k.total) == null ? '-' : `${persen(k.h, k.total)}%`} ket={`${k.alpa} kali alpa`} href={`/rekap?kelas=${k.id}`} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Kartu judul="Alpa terbanyak (30 hari)">
          {alpa.length === 0 ? <Kosong>Tidak ada siswa alpa.</Kosong> : (
            <table className="tabel"><thead><tr><th>Siswa</th><th>Kelas</th><th>Alpa</th></tr></thead>
              <tbody>{alpa.map((a, i) => <tr key={i}><td>{a.nama}</td><td>{a.kelas}</td><td>{a.n}</td></tr>)}</tbody></table>
          )}
        </Kartu>
        <Kartu judul="Pengumuman terbaru" aksi={<Link href="/pengumuman/baru" className="tautan text-xs">Buat</Link>}>
          <DaftarPengumuman data={peng} />
        </Kartu>
      </div>
    </>
  );
}

async function DashGuru({ user }: { user: CurrentUser }) {
  const { hari, data } = await jadwalHariIni({ guruId: user.id });
  const perluDinilai = await sql`
    select t.id, t.judul, k.nama as kelas, m.nama as mapel, count(pg.id)::int as n
    from tugas t join pengampu p on p.id = t.pengampu_id
    join kelas k on k.id = p.kelas_id join mapel m on m.id = p.mapel_id
    join pengumpulan pg on pg.tugas_id = t.id and pg.nilai is null
    where p.guru_id = ${user.id}
    group by t.id, t.judul, k.nama, m.nama order by min(pg.dikirim_pada) limit 6`;
  const [pesan] = await sql`select count(*)::int as n from pesan_langsung where penerima_id = ${user.id} and not dibaca`;
  return (
    <>
      <Judul judul={`Assalamualaikum, ${user.nama}`} sub={`${NAMA_HARI[hari]}, ${fmtTanggal(todayWIB(), false)}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <KartuJadwal judul="Jadwal mengajar hari ini" hari={hari} data={data} guru />
        <div className="space-y-4">
          <Kartu judul="Tugas yang perlu dinilai" aksi={<Link href="/tugas" className="tautan text-xs">Semua tugas</Link>}>
            {perluDinilai.length === 0 ? <Kosong>Semua pengumpulan sudah dinilai.</Kosong> : (
              <ul className="divide-y divide-slate-100">
                {perluDinilai.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/tugas/${t.id}`} className="tautan text-sm">{t.judul}<span className="block text-xs font-normal text-slate-500">{t.mapel} · {t.kelas}</span></Link>
                    <Lencana warna="kuning">{t.n} belum dinilai</Lencana>
                  </li>
                ))}
              </ul>
            )}
          </Kartu>
          <Kartu judul="Pesan orang tua">
            <p className="text-sm">{pesan.n > 0 ? `${pesan.n} pesan belum dibaca.` : 'Tidak ada pesan baru.'} <Link href="/pesan" className="tautan">Buka pesan</Link></p>
          </Kartu>
        </div>
      </div>
    </>
  );
}

async function tugasTerdekat(siswaId: number, kelasId: number) {
  return sql`
    select t.id, t.judul, t.tenggat, m.nama as mapel
    from tugas t join pengampu p on p.id = t.pengampu_id join mapel m on m.id = p.mapel_id
    where p.kelas_id = ${kelasId} and t.tenggat > now() - interval '7 days'
      and not exists (select 1 from pengumpulan pg where pg.tugas_id = t.id and pg.siswa_id = ${siswaId})
    order by t.tenggat limit 5`;
}

function KartuTugas({ data, judul }: { data: any[]; judul: string }) {
  return (
    <Kartu judul={judul} aksi={<Link href="/tugas" className="tautan text-xs">Semua tugas</Link>}>
      {data.length === 0 ? <Kosong>Tidak ada tugas yang belum dikumpulkan.</Kosong> : (
        <ul className="divide-y divide-slate-100">
          {data.map((t) => {
            const lewat = new Date(t.tenggat) < new Date();
            return (
              <li key={t.id} className="flex items-center justify-between gap-2 py-2">
                <Link href={`/tugas/${t.id}`} className="tautan text-sm">{t.judul}<span className="block text-xs font-normal text-slate-500">{t.mapel}</span></Link>
                <span className="shrink-0"><Lencana warna={lewat ? 'merah' : 'kuning'}>{lewat ? 'Lewat tenggat' : fmtSingkat(t.tenggat)}</Lencana></span>
              </li>
            );
          })}
        </ul>
      )}
    </Kartu>
  );
}

async function nilaiBaru(siswaId: number, kelasId: number) {
  return sql`
    select m.nama as mapel, max(pg.dinilai_pada) as waktu, avg(pg.nilai)::float as rata
    from pengumpulan pg join tugas t on t.id = pg.tugas_id join pengampu p on p.id = t.pengampu_id join mapel m on m.id = p.mapel_id
    where pg.siswa_id = ${siswaId} and p.kelas_id = ${kelasId} and pg.nilai is not null and p.nilai_terbit
    group by m.nama order by waktu desc nulls last limit 4`;
}

async function DashSiswa({ user }: { user: CurrentUser }) {
  if (!user.kelasId) return <Kosong>Akun belum dimasukkan ke kelas. Hubungi operator madrasah.</Kosong>;
  const { hari, data } = await jadwalHariIni({ kelasId: user.kelasId });
  const [tugas, nilai, peng] = await Promise.all([tugasTerdekat(user.id, user.kelasId), nilaiBaru(user.id, user.kelasId), pengumumanTerbaru(user)]);
  return (
    <>
      <Judul judul={`Halo, ${user.nama.split(' ')[0]}!`} sub={`Kelas ${user.kelasNama} · ${fmtTanggal(todayWIB())}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <KartuJadwal judul="Jadwal hari ini" hari={hari} data={data} />
        <KartuTugas data={tugas} judul="Tugas terdekat" />
        <Kartu judul="Nilai tugas terbaru" aksi={<Link href="/nilai" className="tautan text-xs">Nilai saya</Link>}>
          {nilai.length === 0 ? <Kosong>Belum ada nilai yang terbit.</Kosong> : (
            <ul className="divide-y divide-slate-100">{nilai.map((n) => <li key={n.mapel} className="flex justify-between py-2 text-sm"><span>{n.mapel}</span><span className="font-semibold">{nilaiTampil(Math.round(n.rata * 10) / 10)}</span></li>)}</ul>
          )}
        </Kartu>
        <Kartu judul="Pengumuman"><DaftarPengumuman data={peng} /></Kartu>
      </div>
    </>
  );
}

async function DashOrtu({ user }: { user: CurrentUser }) {
  const anak = user.anakAktif;
  if (!anak || !anak.kelas_id) return <Kosong>Akun belum terhubung dengan data anak. Hubungi operator madrasah.</Kosong>;
  const hari = todayWIB();
  const [hadir] = await sql`
    select count(*) filter (where a.status = 'H')::int as h, count(*) filter (where a.status = 'S')::int as s,
      count(*) filter (where a.status = 'I')::int as i, count(*) filter (where a.status = 'A')::int as a, count(*)::int as total
    from absensi a join pertemuan pt on pt.id = a.pertemuan_id
    where a.siswa_id = ${anak.id} and pt.tanggal between ${tambahHari(hari, -6)} and ${hari}`;
  const [tugas, nilai, peng] = await Promise.all([tugasTerdekat(anak.id, anak.kelas_id), nilaiBaru(anak.id, anak.kelas_id), pengumumanTerbaru(user)]);
  return (
    <>
      <Judul judul={`Ringkasan ${anak.nama}`} sub={`Kelas ${anak.kelas_nama} · ${fmtTanggal(hari)}`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Statistik label="Kehadiran 7 hari" nilai={persen(hadir.h, hadir.total) == null ? '-' : `${persen(hadir.h, hadir.total)}%`} href="/absensi" />
        <Statistik label="Sakit / Izin" nilai={`${hadir.s} / ${hadir.i}`} />
        <Statistik label="Alpa" nilai={hadir.a} />
        <Statistik label="Tugas belum dikumpulkan" nilai={tugas.length} href="/tugas" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <KartuTugas data={tugas} judul="Tugas yang belum dikumpulkan" />
        <Kartu judul="Nilai tugas terbaru" aksi={<Link href="/nilai" className="tautan text-xs">Semua nilai</Link>}>
          {nilai.length === 0 ? <Kosong>Belum ada nilai yang terbit.</Kosong> : (
            <ul className="divide-y divide-slate-100">{nilai.map((n) => <li key={n.mapel} className="flex justify-between py-2 text-sm"><span>{n.mapel}</span><span className="font-semibold">{nilaiTampil(Math.round(n.rata * 10) / 10)}</span></li>)}</ul>
          )}
        </Kartu>
        <Kartu judul="Pengumuman"><DaftarPengumuman data={peng} /></Kartu>
        <Kartu judul="Hubungi guru"><p className="text-sm">Ada pertanyaan tentang perkembangan anak? <Link href="/pesan" className="tautan">Kirim pesan ke wali kelas atau guru mapel</Link>.</p></Kartu>
      </div>
    </>
  );
}

export default async function Dashboard() {
  const user = await requireUser();
  switch (user.peran) {
    case 'admin': return <DashAdmin user={user} />;
    case 'kepala': return <DashKepala user={user} />;
    case 'guru': return <DashGuru user={user} />;
    case 'siswa': return <DashSiswa user={user} />;
    case 'ortu': return <DashOrtu user={user} />;
  }
}
