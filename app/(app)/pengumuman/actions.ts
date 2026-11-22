'use server';

import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { kembali, teks } from '@/lib/flash';
import { kirimNotif } from '@/lib/notify';
import { simpanFile } from '@/lib/storage';
import { dariInputWaktu } from '@/lib/time';

/** KF-27: admin/kepala ke seluruh sekolah atau peran tertentu; guru ke kelas yang diajarnya. */
export async function buatPengumuman(fd: FormData) {
  const user = await requireUser(['admin', 'kepala', 'guru']);
  const judul = teks(fd, 'judul');
  const isi = teks(fd, 'isi');
  let peran = teks(fd, 'sasaran_peran') || null;
  const kelasId = Number(fd.get('sasaran_kelas_id')) || null;
  if (!judul || !isi) kembali('/pengumuman/baru', { err: 'Judul dan isi wajib diisi.' });
  if (peran && !['guru', 'siswa', 'ortu'].includes(peran)) peran = null;

  if (user.peran === 'guru') {
    if (!kelasId) kembali('/pengumuman/baru', { err: 'Pilih kelas tujuan.' });
    const [boleh] = await sql`
      select 1 from kelas where id = ${kelasId}
        and (wali_kelas_id = ${user.id} or id in (select kelas_id from pengampu where guru_id = ${user.id}))`;
    if (!boleh) kembali('/pengumuman/baru', { err: 'Anda hanya bisa mengumumkan ke kelas yang Anda ajar.' });
    if (peran === 'guru') peran = null;
  }
  if (kelasId && peran === 'guru') peran = null;

  let file: { path: string; nama: string } | null = null;
  try {
    file = await simpanFile(fd.get('lampiran'), 'pengumuman');
  } catch (e) {
    kembali('/pengumuman/baru', { err: (e as Error).message });
  }
  const mulai = teks(fd, 'tayang_mulai') ? dariInputWaktu(teks(fd, 'tayang_mulai')) : new Date();
  const akhir = teks(fd, 'tayang_akhir') ? dariInputWaktu(teks(fd, 'tayang_akhir')) : null;
  if (akhir && akhir <= mulai) kembali('/pengumuman/baru', { err: 'Akhir tayang harus setelah mulai tayang.' });
  const sematkan = user.peran !== 'guru' && fd.get('disematkan') === 'on';

  const [pg] = await sql`
    insert into pengumuman (pembuat_id, judul, isi, lampiran_path, lampiran_nama, sasaran_peran, sasaran_kelas_id, tayang_mulai, tayang_akhir, disematkan)
    values (${user.id}, ${judul}, ${isi}, ${file?.path ?? null}, ${file?.nama ?? null}, ${peran}, ${kelasId}, ${mulai}, ${akhir}, ${sematkan})
    returning id`;

  if (mulai <= new Date()) {
    const penerima = await sql`
      select u.id from users u
      left join siswa s on s.user_id = u.id
      where u.aktif and u.id <> ${user.id}
        and (${peran}::text is null or u.peran = ${peran})
        and (
          (${kelasId}::int is null and u.peran in ('guru', 'siswa', 'ortu', 'kepala', 'admin'))
          or (${kelasId}::int is not null and (
            s.kelas_id = ${kelasId}
            or u.id in (select os.ortu_id from ortu_siswa os join siswa s2 on s2.user_id = os.siswa_id where s2.kelas_id = ${kelasId})
          ))
        )`;
    await kirimNotif(penerima.map((r) => r.id), 'pengumuman', `Pengumuman: ${judul}`, `/pengumuman/${pg.id}`);
  }
  kembali(`/pengumuman/${pg.id}`, { ok: 'Pengumuman diterbitkan.' });
}

export async function hapusPengumuman(fd: FormData) {
  const user = await requireUser(['admin', 'kepala', 'guru']);
  const id = Number(fd.get('id'));
  const [pg] = await sql`select pembuat_id from pengumuman where id = ${id}`;
  if (!pg || (user.peran !== 'admin' && pg.pembuat_id !== user.id)) kembali('/pengumuman', { err: 'Tidak bisa menghapus pengumuman ini.' });
  await sql`delete from pengumuman where id = ${id}`;
  kembali('/pengumuman', { ok: 'Pengumuman dihapus.' });
}

export async function sematkan(fd: FormData) {
  await requireUser(['admin', 'kepala']);
  const id = Number(fd.get('id'));
  await sql`update pengumuman set disematkan = not disematkan where id = ${id}`;
  kembali(`/pengumuman/${id}`, { ok: 'Status sematan diperbarui.' });
}
