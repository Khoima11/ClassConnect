import 'server-only';
import { redirect } from 'next/navigation';
import { sql } from './db';
import { BOBOT_BAWAAN, nilaiAkhir, rata, type Bobot } from './nilai';
import type { CurrentUser } from './types';

export type PengampuInfo = {
  id: number;
  guru_id: number;
  guru_nama: string;
  mapel_id: number;
  mapel_nama: string;
  kelas_id: number;
  kelas_nama: string;
  nilai_terbit: boolean;
  diskusi_terkunci: boolean;
};

export async function sekolah() {
  const [s] = await sql`select * from sekolah where id = 1`;
  return (s ?? { nama: 'ClassConnect', mode_demo: true }) as {
    nama: string; nsm: string | null; alamat: string | null; logo_path: string | null; kepala_nama: string | null; mode_demo: boolean;
  };
}

export async function tahunAktif() {
  const [t] = await sql`select * from tahun_ajaran where aktif order by id desc limit 1`;
  return t as { id: number; nama: string; semester: string } | undefined;
}

export async function bobotAktif(): Promise<Bobot> {
  const t = await tahunAktif();
  if (!t) return BOBOT_BAWAAN;
  const [b] = await sql`select tugas, uh, pts, pas from bobot_nilai where tahun_ajaran_id = ${t.id}`;
  return (b as unknown as Bobot) ?? BOBOT_BAWAAN;
}

export async function semuaKelas() {
  return (await sql`
    select k.id, k.nama, k.tingkat, k.wali_kelas_id, u.nama as wali_nama,
      (select count(*)::int from siswa s where s.kelas_id = k.id) as jumlah_siswa
    from kelas k
    join tahun_ajaran t on t.id = k.tahun_ajaran_id and t.aktif
    left join users u on u.id = k.wali_kelas_id
    order by k.tingkat, k.nama`) as unknown as {
    id: number; nama: string; tingkat: number; wali_kelas_id: number | null; wali_nama: string | null; jumlah_siswa: number;
  }[];
}

export async function pengampu(id: number): Promise<PengampuInfo | null> {
  const [p] = await sql`
    select p.id, p.guru_id, g.nama as guru_nama, p.mapel_id, m.nama as mapel_nama,
      p.kelas_id, k.nama as kelas_nama, p.nilai_terbit, p.diskusi_terkunci
    from pengampu p
    join users g on g.id = p.guru_id
    join mapel m on m.id = p.mapel_id
    join kelas k on k.id = p.kelas_id
    where p.id = ${id}`;
  return (p as unknown as PengampuInfo) ?? null;
}

export async function pengampuGuru(guruId: number): Promise<PengampuInfo[]> {
  return (await sql`
    select p.id, p.guru_id, g.nama as guru_nama, p.mapel_id, m.nama as mapel_nama,
      p.kelas_id, k.nama as kelas_nama, p.nilai_terbit, p.diskusi_terkunci
    from pengampu p
    join users g on g.id = p.guru_id
    join mapel m on m.id = p.mapel_id
    join kelas k on k.id = p.kelas_id
    where p.guru_id = ${guruId}
    order by k.tingkat, k.nama, m.nama`) as unknown as PengampuInfo[];
}

export async function pengampuKelas(kelasId: number): Promise<PengampuInfo[]> {
  return (await sql`
    select p.id, p.guru_id, g.nama as guru_nama, p.mapel_id, m.nama as mapel_nama,
      p.kelas_id, k.nama as kelas_nama, p.nilai_terbit, p.diskusi_terkunci
    from pengampu p
    join users g on g.id = p.guru_id
    join mapel m on m.id = p.mapel_id
    join kelas k on k.id = p.kelas_id
    where p.kelas_id = ${kelasId}
    order by m.kelompok desc, m.nama`) as unknown as PengampuInfo[];
}

/** Kelas yang datanya boleh dilihat pengguna ini sebagai siswa/orang tua. */
export function kelasMilik(user: CurrentUser): number | null {
  if (user.peran === 'siswa') return user.kelasId;
  if (user.peran === 'ortu') return user.anakAktif?.kelas_id ?? null;
  return null;
}

/** Siswa yang datanya dilihat (diri sendiri atau anak aktif). */
export function siswaMilik(user: CurrentUser): number | null {
  if (user.peran === 'siswa') return user.id;
  if (user.peran === 'ortu') return user.anakAktif?.id ?? null;
  return null;
}

/** Periksa hak akses ke satu kelas–mapel (KNF-03). */
export async function cekPengampu(user: CurrentUser, id: number, mode: 'baca' | 'tulis'): Promise<PengampuInfo> {
  const p = await pengampu(id);
  if (!p) redirect('/tidak-diizinkan');
  const gurunya = user.peran === 'guru' && p.guru_id === user.id;
  if (mode === 'tulis') {
    if (!gurunya) redirect('/tidak-diizinkan');
    return p;
  }
  const boleh =
    gurunya ||
    user.peran === 'admin' ||
    user.peran === 'kepala' ||
    (user.peran === 'guru' && user.waliKelas.some((k) => k.id === p.kelas_id)) ||
    (user.peran === 'siswa' && user.kelasId === p.kelas_id) ||
    (user.peran === 'ortu' && user.anakAktif?.kelas_id === p.kelas_id);
  if (!boleh) redirect('/tidak-diizinkan');
  return p;
}

export async function daftarSiswaKelas(kelasId: number) {
  return (await sql`
    select u.id, u.nama, s.nisn, s.jenis_kelamin
    from siswa s join users u on u.id = s.user_id
    where s.kelas_id = ${kelasId} and u.aktif
    order by u.nama`) as unknown as { id: number; nama: string; nisn: string; jenis_kelamin: string }[];
}

export type BarisNilai = {
  siswa_id: number;
  nama: string;
  tugas: number | null;
  uh: (number | null)[];
  pts: number | null;
  pas: number | null;
  akhir: number | null;
  lengkap: boolean;
};

/** Nilai satu kelas–mapel untuk semua siswa (KF-23–KF-25). */
export async function nilaiPengampu(p: PengampuInfo, bobot: Bobot): Promise<{ baris: BarisNilai[]; jumlahUH: number }> {
  const siswa = await daftarSiswaKelas(p.kelas_id);
  const tugas = await sql`
    select pg.siswa_id, avg(pg.nilai)::float as rata
    from pengumpulan pg join tugas t on t.id = pg.tugas_id
    where t.pengampu_id = ${p.id} and pg.nilai is not null
    group by pg.siswa_id`;
  const nilai = await sql`select siswa_id, komponen, urutan, nilai from nilai where pengampu_id = ${p.id}`;
  const jumlahUH = Math.max(1, ...nilai.filter((n) => n.komponen === 'UH').map((n) => n.urutan));

  const baris = siswa.map((s) => {
    const t = tugas.find((x) => x.siswa_id === s.id);
    const milik = nilai.filter((n) => n.siswa_id === s.id);
    const uh: (number | null)[] = [];
    for (let i = 1; i <= jumlahUH; i++) uh.push(milik.find((n) => n.komponen === 'UH' && n.urutan === i)?.nilai ?? null);
    const pts = milik.find((n) => n.komponen === 'PTS')?.nilai ?? null;
    const pas = milik.find((n) => n.komponen === 'PAS')?.nilai ?? null;
    const komponen = {
      tugas: t ? Math.round(t.rata * 10) / 10 : null,
      uh: rata(uh),
      pts,
      pas,
    };
    const { akhir, lengkap } = nilaiAkhir(komponen, bobot);
    return { siswa_id: s.id, nama: s.nama, tugas: komponen.tugas, uh, pts, pas, akhir, lengkap };
  });
  return { baris, jumlahUH };
}

/** Nilai seorang siswa di semua mapel kelasnya. */
export async function nilaiSiswa(siswaId: number, kelasId: number, hanyaTerbit: boolean) {
  const bobot = await bobotAktif();
  const daftar = await pengampuKelas(kelasId);
  const hasil = [];
  for (const p of daftar) {
    if (hanyaTerbit && !p.nilai_terbit) {
      hasil.push({ p, baris: null as BarisNilai | null });
      continue;
    }
    const { baris } = await nilaiPengampu(p, bobot);
    hasil.push({ p, baris: baris.find((b) => b.siswa_id === siswaId) ?? null });
  }
  return { hasil, bobot };
}

/** Rekap absensi per siswa dalam satu kelas untuk rentang tanggal (KF-17). */
export async function rekapAbsensi(kelasId: number, dari: string, sampai: string) {
  return (await sql`
    select u.id, u.nama,
      count(a.*) filter (where a.status = 'H')::int as h,
      count(a.*) filter (where a.status = 'S')::int as s,
      count(a.*) filter (where a.status = 'I')::int as i,
      count(a.*) filter (where a.status = 'A')::int as a,
      count(a.*)::int as total
    from siswa sw
    join users u on u.id = sw.user_id
    left join (
      select ab.siswa_id, ab.status from absensi ab
      join pertemuan pt on pt.id = ab.pertemuan_id
      where pt.tanggal between ${dari} and ${sampai}
    ) a on a.siswa_id = u.id
    where sw.kelas_id = ${kelasId}
    group by u.id, u.nama
    order by u.nama`) as unknown as { id: number; nama: string; h: number; s: number; i: number; a: number; total: number }[];
}

export function persen(h: number, total: number) {
  return total === 0 ? null : Math.round((h / total) * 1000) / 10;
}

export async function jumlahNotifBaru(userId: number) {
  const [r] = await sql`select count(*)::int as n from notifikasi where user_id = ${userId} and not dibaca`;
  return r?.n ?? 0;
}

/** Notifikasi tenggat H-1 dibuat saat siswa membuka aplikasi (tanpa server terjadwal). */
export async function cekTenggat(user: CurrentUser) {
  if (user.peran !== 'siswa' || !user.kelasId) return;
  await sql`
    insert into notifikasi (user_id, jenis, judul, tautan, kunci)
    select ${user.id}, 'tenggat', 'Tenggat besok: ' || t.judul, '/tugas/' || t.id, 'tenggat-' || t.id
    from tugas t join pengampu p on p.id = t.pengampu_id
    where p.kelas_id = ${user.kelasId}
      and t.tenggat between now() and now() + interval '24 hours'
      and not exists (select 1 from pengumpulan pg where pg.tugas_id = t.id and pg.siswa_id = ${user.id})
    on conflict do nothing`;
}

/** Kondisi pengumuman yang boleh dilihat pengguna (KF-28). */
export function filterPengumuman(user: CurrentUser) {
  const kelasSiswa = kelasMilik(user);
  if (user.peran === 'admin' || user.peran === 'kepala') return sql`true`;
  const aktif = sql`(pg.tayang_mulai <= now() and (pg.tayang_akhir is null or pg.tayang_akhir >= now()))`;
  if (user.peran === 'guru') {
    return sql`(pg.pembuat_id = ${user.id} or (${aktif} and pg.sasaran_kelas_id is null and (pg.sasaran_peran is null or pg.sasaran_peran = 'guru'))
      or (${aktif} and pg.sasaran_kelas_id in (select kelas_id from pengampu where guru_id = ${user.id})))`;
  }
  const peran = user.peran; // siswa | ortu
  return sql`(${aktif} and (
    (pg.sasaran_kelas_id is null and (pg.sasaran_peran is null or pg.sasaran_peran = ${peran}))
    or (pg.sasaran_kelas_id = ${kelasSiswa ?? -1} and (pg.sasaran_peran is null or pg.sasaran_peran = ${peran}))
  ))`;
}

/** KF-30: pesan langsung hanya antara orang tua dan guru/wali kelas anaknya. */
export async function hubunganSah(guruId: number, ortuId: number, siswaId: number) {
  const [r] = await sql`
    select 1 from ortu_siswa os join siswa s on s.user_id = os.siswa_id join kelas k on k.id = s.kelas_id
    where os.ortu_id = ${ortuId} and os.siswa_id = ${siswaId}
      and (k.wali_kelas_id = ${guruId} or exists (select 1 from pengampu p where p.kelas_id = k.id and p.guru_id = ${guruId}))`;
  return Boolean(r);
}

