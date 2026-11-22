export type Peran = 'admin' | 'kepala' | 'guru' | 'siswa' | 'ortu';

export const LABEL_PERAN: Record<Peran, string> = {
  admin: 'Admin',
  kepala: 'Kepala Madrasah',
  guru: 'Guru',
  siswa: 'Siswa',
  ortu: 'Orang Tua',
};

export type Anak = { id: number; nama: string; kelas_id: number | null; kelas_nama: string | null };

export type CurrentUser = {
  id: number;
  username: string;
  nama: string;
  peran: Peran;
  no_hp: string | null;
  foto_path: string | null;
  kelasId: number | null; // untuk siswa
  kelasNama: string | null;
  waliKelas: { id: number; nama: string }[]; // untuk guru yang menjadi wali kelas
  anak: Anak[]; // untuk orang tua
  anakAktif: Anak | null;
};

export const STATUS_ABSEN: Record<string, string> = { H: 'Hadir', S: 'Sakit', I: 'Izin', A: 'Alpa' };

export function labelSasaran(peran: string | null, kelas: string | null) {
  const p = peran === 'guru' ? 'Guru' : peran === 'siswa' ? 'Siswa' : peran === 'ortu' ? 'Orang tua' : null;
  if (kelas) return `${p ?? 'Siswa & orang tua'} kelas ${kelas}`;
  return p ?? 'Semua';
}
