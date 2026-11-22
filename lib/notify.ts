import 'server-only';
import { sql } from './db';

/** Kirim notifikasi dalam aplikasi (KF-32). `kunci` mencegah notifikasi ganda. */
export async function kirimNotif(userIds: number[], jenis: string, judul: string, tautan?: string, kunci?: string) {
  const unik = [...new Set(userIds)].filter(Boolean);
  if (unik.length === 0) return;
  const baris = unik.map((user_id) => ({ user_id, jenis, judul, tautan: tautan ?? null, kunci: kunci ?? null }));
  await sql`insert into notifikasi ${sql(baris, 'user_id', 'jenis', 'judul', 'tautan', 'kunci')} on conflict do nothing`;
}

export async function siswaKelas(kelasId: number): Promise<number[]> {
  const r = await sql`select user_id from siswa where kelas_id = ${kelasId}`;
  return r.map((x) => x.user_id);
}

export async function ortuDariSiswa(siswaIds: number[]): Promise<number[]> {
  if (siswaIds.length === 0) return [];
  const r = await sql`select distinct ortu_id from ortu_siswa where siswa_id in ${sql(siswaIds)}`;
  return r.map((x) => x.ortu_id);
}
