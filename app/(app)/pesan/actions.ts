'use server';

import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { kembali, teks } from '@/lib/flash';
import { kirimNotif } from '@/lib/notify';
import { hubunganSah } from '@/lib/data';

export async function kirimPesan(fd: FormData) {
  const user = await requireUser(['guru', 'ortu']);
  const lawan = Number(fd.get('lawan'));
  const siswaId = Number(fd.get('siswa'));
  const tujuan = `/pesan/${lawan}?siswa=${siswaId}`;
  const isi = teks(fd, 'isi');
  if (!isi) kembali(tujuan, {});
  const [guruId, ortuId] = user.peran === 'guru' ? [user.id, lawan] : [lawan, user.id];
  if (!(await hubunganSah(guruId, ortuId, siswaId))) kembali('/pesan', { err: 'Percakapan ini tidak diizinkan.' });
  await sql`insert into pesan_langsung (pengirim_id, penerima_id, siswa_id, isi) values (${user.id}, ${lawan}, ${siswaId}, ${isi.slice(0, 2000)})`;
  await kirimNotif([lawan], 'pesan', `Pesan baru dari ${user.nama}`, `/pesan/${user.id}?siswa=${siswaId}`);
  kembali(tujuan + '#akhir', {});
}

export async function laporkanPesan(fd: FormData) {
  const user = await requireUser(['guru', 'ortu']);
  const id = Number(fd.get('id'));
  await sql`update pesan_langsung set dilaporkan = true where id = ${id} and penerima_id = ${user.id}`;
  kembali(String(fd.get('kembali') ?? '/pesan'), { ok: 'Pesan dilaporkan ke admin.' });
}
