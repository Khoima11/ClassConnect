import { BarisMenu, Judul } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sekolah } from '@/lib/data';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminHub() {
  await requireUser(['admin']);
  const [c] = await sql`select
    (select count(*)::int from tahun_ajaran) as ta, (select count(*)::int from kelas) as kelas, (select count(*)::int from mapel) as mapel,
    (select count(*)::int from siswa) as siswa, (select count(*)::int from guru) as guru, (select count(*)::int from users where peran = 'ortu') as ortu,
    (select count(*)::int from jadwal) as jadwal`;
  const demo = (await sekolah()).mode_demo;
  const menu = [
    ['/admin/sekolah', 'pengaturan', 'Pengaturan Sekolah', 'Nama, logo, alamat, mode demo'],
    ['/admin/tahun-ajaran', 'jadwal', 'Tahun Ajaran', `${c.ta} tahun ajaran`],
    ['/admin/kelas', 'kelas', 'Kelas & Wali Kelas', `${c.kelas} kelas`],
    ['/admin/mapel', 'tugas', 'Mapel & Guru Pengampu', `${c.mapel} mapel`],
    ['/admin/siswa', 'profil', 'Data Siswa', `${c.siswa} siswa`],
    ['/admin/guru', 'kelas', 'Data Guru', `${c.guru} guru`],
    ['/admin/ortu', 'kelas', 'Data Orang Tua', `${c.ortu} akun`],
    ['/admin/impor', 'data', 'Impor dari Excel', 'Siswa dan guru (CSV)'],
    ['/admin/jadwal', 'jam', 'Jadwal Pelajaran', `${c.jadwal} pertemuan/minggu`],
    ['/admin/bobot', 'nilai', 'Bobot Nilai', 'Tugas, UH, PTS, PAS'],
    ['/admin/laporan', 'laporan', 'Pesan Dilaporkan', 'Moderasi komunikasi'],
    ['/admin/reset', 'info', 'Reset Data Demo', 'Kembalikan data contoh'],
  ].filter(([href]) => href !== '/admin/reset' || demo);
  return (
    <>
      <Judul judul="Data Master" sub="Kelola data dasar madrasah" />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {menu.map(([href, ikon, judul, ket]) => <BarisMenu key={href} href={href} ikon={ikon} judul={judul} ket={ket} />)}
      </div>
    </>
  );
}
