'use server';

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql } from '@/lib/db';
import { COOKIE_SESI, buatToken, opsiCookie } from '@/lib/session';
import { SANDI_DEMO } from '@/lib/seed';
import type { Peran } from '@/lib/types';

export type HasilLogin = { galat?: string };

async function masuk(userId: number, peran: Peran, lanjut: string) {
  const jar = await cookies();
  jar.set(COOKIE_SESI, await buatToken({ uid: userId, peran }), opsiCookie);
  redirect(lanjut.startsWith('/') && !lanjut.startsWith('//') ? lanjut : '/dashboard');
}

/** KF-01: login dengan username, NISN (siswa), atau NIP (guru). Salah 5 kali = dikunci 5 menit. */
export async function login(_: HasilLogin, fd: FormData): Promise<HasilLogin> {
  const nama = String(fd.get('username') ?? '').trim();
  const sandi = String(fd.get('password') ?? '');
  const lanjut = String(fd.get('lanjut') ?? '/dashboard');
  if (!nama || !sandi) return { galat: 'Isi username dan kata sandi.' };

  const [u] = await sql`
    select id, peran, password_hash, aktif, gagal_login, kunci_sampai from users
    where lower(username) = lower(${nama})
       or id in (select user_id from siswa where nisn = ${nama})
       or id in (select user_id from guru where nip = ${nama})
    limit 1`;
  if (!u || !u.aktif) return { galat: 'Username atau kata sandi salah.' };
  if (u.kunci_sampai && new Date(u.kunci_sampai) > new Date()) {
    return { galat: 'Akun dikunci sementara karena 5 kali salah kata sandi. Coba lagi dalam 5 menit.' };
  }
  if (!(await bcrypt.compare(sandi, u.password_hash))) {
    const gagal = u.gagal_login + 1;
    if (gagal >= 5) {
      await sql`update users set gagal_login = 0, kunci_sampai = now() + interval '5 minutes' where id = ${u.id}`;
      return { galat: 'Akun dikunci 5 menit karena 5 kali salah kata sandi.' };
    }
    await sql`update users set gagal_login = ${gagal} where id = ${u.id}`;
    return { galat: `Username atau kata sandi salah (${gagal}/5).` };
  }
  await sql`update users set gagal_login = 0, kunci_sampai = null where id = ${u.id}`;
  await masuk(u.id, u.peran, lanjut);
  return {};
}

/** KF-33: tombol masuk cepat, hanya saat mode demo aktif. */
export async function loginDemo(fd: FormData) {
  const username = String(fd.get('username') ?? '');
  const [s] = await sql`select mode_demo from sekolah where id = 1`;
  if (!s?.mode_demo) redirect('/login');
  const [u] = await sql`select id, peran, password_hash from users where username = ${username} and aktif`;
  if (!u || !(await bcrypt.compare(SANDI_DEMO, u.password_hash))) redirect('/login?demo=gagal');
  await masuk(u.id, u.peran, '/dashboard');
}

export async function logout() {
  const jar = await cookies();
  jar.delete(COOKIE_SESI);
  jar.delete('cc_anak');
  redirect('/login');
}
