'use server';

import bcrypt from 'bcryptjs';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { kembali, teks } from '@/lib/flash';
import { simpanFile } from '@/lib/storage';

/** KF-03 */
export async function ubahProfil(fd: FormData) {
  const user = await requireUser();
  const hp = teks(fd, 'no_hp');
  if (hp && !/^[0-9+ -]{8,16}$/.test(hp)) kembali('/profil', { err: 'Nomor HP tidak valid.' });
  let foto: { path: string } | null = null;
  try {
    foto = await simpanFile(fd.get('foto'), 'profil');
  } catch (e) {
    kembali('/profil', { err: (e as Error).message });
  }
  await sql`update users set no_hp = ${hp || null} ${foto ? sql`, foto_path = ${foto.path}` : sql``} where id = ${user.id}`;
  kembali('/profil', { ok: 'Profil diperbarui.' });
}

export async function ubahSandi(fd: FormData) {
  const user = await requireUser();
  const lama = String(fd.get('lama') ?? '');
  const baru = String(fd.get('baru') ?? '');
  const ulang = String(fd.get('ulang') ?? '');
  if (baru.length < 6) kembali('/profil', { err: 'Kata sandi baru minimal 6 karakter.' });
  if (baru !== ulang) kembali('/profil', { err: 'Ulangi kata sandi baru dengan benar.' });
  const [u] = await sql`select password_hash from users where id = ${user.id}`;
  if (!(await bcrypt.compare(lama, u.password_hash))) kembali('/profil', { err: 'Kata sandi lama salah.' });
  await sql`update users set password_hash = ${await bcrypt.hash(baru, 10)} where id = ${user.id}`;
  kembali('/profil', { ok: 'Kata sandi berhasil diganti.' });
}
