import type { CurrentUser } from './types';

export type ItemMenu = { href: string; label: string; ikon: string; ket?: string };

/** Menu per peran: dipakai menu samping, menu bawah (HP), dan kotak menu di beranda. */
export function menuUntuk(u: CurrentUser): ItemMenu[] {
  const dash = { href: '/dashboard', label: 'Beranda', ikon: 'beranda' };
  const umum = { href: '/pengumuman', label: 'Pengumuman', ikon: 'pengumuman', ket: 'Info madrasah' };
  switch (u.peran) {
    case 'admin':
      return [
        dash,
        { href: '/admin', label: 'Data Master', ikon: 'data', ket: 'Siswa, guru, kelas' },
        { href: '/admin/jadwal', label: 'Jadwal', ikon: 'jadwal', ket: 'Susun jadwal' },
        umum,
        { href: '/rekap', label: 'Rekap', ikon: 'rekap', ket: 'Absensi & nilai' },
        { href: '/admin/laporan', label: 'Laporan Pesan', ikon: 'laporan', ket: 'Moderasi' },
        { href: '/admin/sekolah', label: 'Pengaturan', ikon: 'pengaturan', ket: 'Identitas sekolah' },
      ];
    case 'kepala':
      return [
        dash,
        { href: '/rekap', label: 'Rekap', ikon: 'rekap', ket: 'Absensi & nilai' },
        umum,
        { href: '/jadwal', label: 'Jadwal', ikon: 'jadwal', ket: 'Jadwal kelas' },
        { href: '/tugas', label: 'Tugas', ikon: 'tugas', ket: 'Ringkasan tugas' },
      ];
    case 'guru':
      return [
        dash,
        { href: '/absensi', label: 'Absensi', ikon: 'absensi', ket: 'Isi kehadiran' },
        { href: '/tugas', label: 'Tugas', ikon: 'tugas', ket: 'Buat & nilai' },
        { href: '/nilai', label: 'Nilai', ikon: 'nilai', ket: 'UH, PTS, PAS' },
        { href: '/jadwal', label: 'Jadwal', ikon: 'jadwal', ket: 'Jadwal mengajar' },
        { href: '/diskusi', label: 'Diskusi', ikon: 'diskusi', ket: 'Ruang kelas' },
        { href: '/pesan', label: 'Pesan Ortu', ikon: 'pesan', ket: 'Orang tua siswa' },
        umum,
        ...(u.waliKelas.length ? [{ href: '/rekap', label: 'Kelas Saya', ikon: 'kelas', ket: 'Perwalian' }] : []),
      ];
    case 'siswa':
      return [
        dash,
        { href: '/tugas', label: 'Tugas', ikon: 'tugas', ket: 'Kumpulkan tugas' },
        { href: '/jadwal', label: 'Jadwal', ikon: 'jadwal', ket: 'Jadwal pelajaran' },
        { href: '/nilai', label: 'Nilai', ikon: 'nilai', ket: 'Hasil belajar' },
        { href: '/absensi', label: 'Kehadiran', ikon: 'absensi', ket: 'Riwayat hadir' },
        { href: '/diskusi', label: 'Diskusi', ikon: 'diskusi', ket: 'Tanya guru' },
        umum,
      ];
    case 'ortu':
      return [
        dash,
        { href: '/absensi', label: 'Kehadiran', ikon: 'absensi', ket: 'Kehadiran anak' },
        { href: '/nilai', label: 'Nilai', ikon: 'nilai', ket: 'Hasil belajar' },
        { href: '/pesan', label: 'Pesan', ikon: 'pesan', ket: 'Hubungi guru' },
        { href: '/tugas', label: 'Tugas', ikon: 'tugas', ket: 'Status tugas' },
        { href: '/jadwal', label: 'Jadwal', ikon: 'jadwal', ket: 'Jadwal anak' },
        umum,
      ];
  }
}
