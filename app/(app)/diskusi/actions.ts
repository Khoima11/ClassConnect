'use server';

import { requireUser } from '@/lib/auth';
import { cekPengampu } from '@/lib/data';
import { sql } from '@/lib/db';
import { kembali, teks } from '@/lib/flash';

async function bolehDiskusi(pengampuId: number) {
  const user = await requireUser(['guru', 'siswa']);
  const p = await cekPengampu(user, pengampuId, 'baca');
  const gurunya = user.peran === 'guru' && p.guru_id === user.id;
  if (!gurunya && user.peran !== 'siswa') kembali('/diskusi', { err: 'Diskusi hanya untuk guru mapel dan siswa kelasnya.' });
  return { user, p, gurunya };
}

/** KF-29 */
export async function kirimDiskusi(fd: FormData) {
  const id = Number(fd.get('pengampu_id'));
  const { user, p, gurunya } = await bolehDiskusi(id);
  const isi = teks(fd, 'isi');
  if (!isi) kembali(`/diskusi/${id}`, {});
  if (p.diskusi_terkunci && !gurunya) kembali(`/diskusi/${id}`, { err: 'Diskusi sedang dikunci guru.' });
  await sql`insert into pesan_diskusi (pengampu_id, pengirim_id, isi) values (${id}, ${user.id}, ${isi.slice(0, 2000)})`;
  kembali(`/diskusi/${id}#akhir`, {});
}

export async function hapusDiskusi(fd: FormData) {
  const id = Number(fd.get('pengampu_id'));
  const { gurunya, user } = await bolehDiskusi(id);
  const pesanId = Number(fd.get('pesan_id'));
  // guru menghapus pesan siapa pun; siswa hanya pesannya sendiri
  await sql`update pesan_diskusi set dihapus = true
    where id = ${pesanId} and pengampu_id = ${id} ${gurunya ? sql`` : sql`and pengirim_id = ${user.id}`}`;
  kembali(`/diskusi/${id}`, { ok: 'Pesan dihapus.' });
}

export async function kunciDiskusi(fd: FormData) {
  const id = Number(fd.get('pengampu_id'));
  const { gurunya } = await bolehDiskusi(id);
  if (!gurunya) kembali(`/diskusi/${id}`, { err: 'Hanya guru mapel yang bisa mengunci diskusi.' });
  await sql`update pengampu set diskusi_terkunci = not diskusi_terkunci where id = ${id}`;
  kembali(`/diskusi/${id}`, { ok: 'Status diskusi diperbarui.' });
}

/** KF-31: laporkan pesan ke admin. */
export async function laporkanDiskusi(fd: FormData) {
  const id = Number(fd.get('pengampu_id'));
  await bolehDiskusi(id);
  await sql`update pesan_diskusi set dilaporkan = true where id = ${Number(fd.get('pesan_id'))} and pengampu_id = ${id}`;
  kembali(`/diskusi/${id}`, { ok: 'Pesan dilaporkan ke admin. Terima kasih.' });
}
