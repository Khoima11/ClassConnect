import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { sql } from './db';
import { COOKIE_SESI, bacaToken } from './session';
import type { Anak, CurrentUser, Peran } from './types';

const ambilUser = cache(async (): Promise<CurrentUser | null> => {
  const jar = await cookies();
  const sesi = await bacaToken(jar.get(COOKIE_SESI)?.value);
  if (!sesi) return null;

  const [u] = await sql`
    select u.id, u.username, u.nama, u.peran, u.no_hp, u.foto_path, s.kelas_id, k.nama as kelas_nama
    from users u
    left join siswa s on s.user_id = u.id
    left join kelas k on k.id = s.kelas_id
    where u.id = ${sesi.uid} and u.aktif`;
  if (!u) return null;

  let waliKelas: { id: number; nama: string }[] = [];
  let anak: Anak[] = [];
  let anakAktif: Anak | null = null;

  if (u.peran === 'guru') {
    waliKelas = (await sql`select id, nama from kelas where wali_kelas_id = ${u.id} order by nama`) as any;
  }
  if (u.peran === 'ortu') {
    anak = (await sql`
      select us.id, us.nama, s.kelas_id, k.nama as kelas_nama
      from ortu_siswa os
      join users us on us.id = os.siswa_id
      join siswa s on s.user_id = us.id
      left join kelas k on k.id = s.kelas_id
      where os.ortu_id = ${u.id}
      order by us.nama`) as any;
    const pilihan = Number(jar.get('cc_anak')?.value);
    anakAktif = anak.find((a) => a.id === pilihan) ?? anak[0] ?? null;
  }

  return {
    id: u.id,
    username: u.username,
    nama: u.nama,
    peran: u.peran as Peran,
    no_hp: u.no_hp,
    foto_path: u.foto_path,
    kelasId: u.kelas_id ?? null,
    kelasNama: u.kelas_nama ?? null,
    waliKelas,
    anak,
    anakAktif,
  };
});

export async function getUser() {
  return ambilUser();
}

/** Wajib login; jika `peran` diisi, hanya peran tersebut yang boleh (KNF-03). */
export async function requireUser(peran?: Peran[]): Promise<CurrentUser> {
  const user = await ambilUser();
  if (!user) redirect('/login');
  if (peran && !peran.includes(user.peran)) redirect('/tidak-diizinkan');
  return user;
}

export function isWali(user: CurrentUser, kelasId?: number | null) {
  if (user.peran !== 'guru') return false;
  if (kelasId == null) return user.waliKelas.length > 0;
  return user.waliKelas.some((k) => k.id === kelasId);
}
