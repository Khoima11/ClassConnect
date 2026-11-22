import Link from 'next/link';
import { Judul } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminHub() {
  await requireUser(['admin']);
  const [c] = await sql`select
    (select count(*)::int from tahun_ajaran) as ta, (select count(*)::int from kelas) as kelas, (select count(*)::int from mapel) as mapel,
    (select count(*)::int from siswa) as siswa, (select count(*)::int from guru) as guru, (select count(*)::int from users where peran = 'ortu') as ortu,
    (select count(*)::int from jadwal) as jadwal`;
  const menu = [
    ['/admin/sekolah', '⚙️', 'Pengaturan Sekolah', 'Nama, logo, alamat, mode demo'],
    ['/admin/tahun-ajaran', '📅', 'Tahun Ajaran', `${c.ta} tahun ajaran`],
    ['/admin/kelas', '🏫', 'Kelas & Wali Kelas', `${c.kelas} kelas`],
    ['/admin/mapel', '📚', 'Mapel & Guru Pengampu', `${c.mapel} mapel`],
    ['/admin/siswa', '🎒', 'Data Siswa', `${c.siswa} siswa`],
    ['/admin/guru', '👩‍🏫', 'Data Guru', `${c.guru} guru`],
    ['/admin/ortu', '👪', 'Data Orang Tua', `${c.ortu} akun`],
    ['/admin/impor', '📥', 'Impor dari Excel', 'Siswa dan guru (CSV)'],
    ['/admin/jadwal', '🗓️', 'Jadwal Pelajaran', `${c.jadwal} pertemuan/minggu`],
    ['/admin/bobot', '⚖️', 'Bobot Nilai', 'Tugas, UH, PTS, PAS'],
    ['/admin/laporan', '🚩', 'Pesan Dilaporkan', 'Moderasi komunikasi'],
    ['/admin/reset', '♻️', 'Reset Data Demo', 'Kembalikan data contoh'],
  ];
  return (
    <>
      <Judul judul="Data Master" sub="Kelola data dasar madrasah" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {menu.map(([href, ikon, judul, ket]) => (
          <Link key={href} href={href} className="card flex items-center gap-3 hover:border-navy-600">
            <span className="text-2xl">{ikon}</span>
            <div><p className="font-semibold text-navy-900">{judul}</p><p className="text-xs text-slate-500">{ket}</p></div>
          </Link>
        ))}
      </div>
    </>
  );
}
