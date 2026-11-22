'use server';

import { requireUser } from '@/lib/auth';
import { cekPengampu } from '@/lib/data';
import { sql } from '@/lib/db';
import { angka, kembali, teks } from '@/lib/flash';
import { kirimNotif, siswaKelas } from '@/lib/notify';
import { simpanFile } from '@/lib/storage';
import { dariInputWaktu } from '@/lib/time';

function tautanValid(t: string) {
  return t === '' || /^https?:\/\//i.test(t);
}

/** KF-19: guru membuat tugas. */
export async function buatTugas(fd: FormData) {
  const user = await requireUser(['guru']);
  const p = await cekPengampu(user, Number(fd.get('pengampu_id')), 'tulis');
  const judul = teks(fd, 'judul');
  const tenggatStr = teks(fd, 'tenggat');
  const tautan = teks(fd, 'tautan');
  if (!judul || !tenggatStr) kembali('/tugas/baru', { err: 'Judul dan tenggat wajib diisi.' });
  if (!tautanValid(tautan)) kembali('/tugas/baru', { err: 'Tautan harus diawali http:// atau https://' });

  let file: { path: string; nama: string } | null = null;
  try {
    file = await simpanFile(fd.get('lampiran'), 'tugas');
  } catch (e) {
    kembali('/tugas/baru', { err: (e as Error).message });
  }
  const [t] = await sql`
    insert into tugas (pengampu_id, judul, deskripsi, tenggat, lampiran_path, lampiran_nama, tautan, boleh_terlambat)
    values (${p.id}, ${judul}, ${teks(fd, 'deskripsi') || null}, ${dariInputWaktu(tenggatStr)}, ${file?.path ?? null},
      ${file?.nama ?? null}, ${tautan || null}, ${fd.get('boleh_terlambat') === 'on'})
    returning id`;
  await kirimNotif(await siswaKelas(p.kelas_id), 'tugas', `Tugas baru ${p.mapel_nama}: ${judul}`, `/tugas/${t.id}`);
  kembali(`/tugas/${t.id}`, { ok: 'Tugas dibuat dan siswa sudah diberi notifikasi.' });
}

async function tugasMilikGuru(userId: number, tugasId: number) {
  const [t] = await sql`select t.*, p.guru_id, p.kelas_id from tugas t join pengampu p on p.id = t.pengampu_id where t.id = ${tugasId}`;
  if (!t || t.guru_id !== userId) kembali('/tugas', { err: 'Tugas tidak ditemukan.' });
  return t;
}

export async function ubahTugas(fd: FormData) {
  const user = await requireUser(['guru']);
  const id = Number(fd.get('id'));
  await tugasMilikGuru(user.id, id);
  const tenggat = teks(fd, 'tenggat');
  if (!tenggat) kembali(`/tugas/${id}`, { err: 'Tenggat wajib diisi.' });
  await sql`update tugas set tenggat = ${dariInputWaktu(tenggat)}, boleh_terlambat = ${fd.get('boleh_terlambat') === 'on'} where id = ${id}`;
  kembali(`/tugas/${id}`, { ok: 'Pengaturan tugas diperbarui.' });
}

export async function hapusTugas(fd: FormData) {
  const user = await requireUser(['guru']);
  const id = Number(fd.get('id'));
  await tugasMilikGuru(user.id, id);
  await sql`delete from tugas where id = ${id}`;
  kembali('/tugas', { ok: 'Tugas dihapus.' });
}

/** KF-20, KF-21: siswa mengumpulkan tugas. */
export async function kumpulkanTugas(fd: FormData) {
  const user = await requireUser(['siswa']);
  const id = Number(fd.get('id'));
  const tujuan = `/tugas/${id}`;
  const [t] = await sql`select t.*, p.kelas_id from tugas t join pengampu p on p.id = t.pengampu_id where t.id = ${id}`;
  if (!t || t.kelas_id !== user.kelasId) kembali('/tugas', { err: 'Tugas tidak ditemukan.' });

  const lewat = new Date(t.tenggat) < new Date();
  const [lama] = await sql`select id, nilai from pengumpulan where tugas_id = ${id} and siswa_id = ${user.id}`;
  if (lama?.nilai != null) kembali(tujuan, { err: 'Tugas sudah dinilai, tidak bisa dikirim ulang.' });
  if (lewat && !t.boleh_terlambat) kembali(tujuan, { err: 'Tenggat sudah lewat dan guru tidak mengizinkan pengumpulan terlambat.' });
  if (lewat && lama) kembali(tujuan, { err: 'Tenggat sudah lewat. Pengiriman ulang hanya bisa sebelum tenggat.' });

  const jawaban = teks(fd, 'jawaban');
  const tautan = teks(fd, 'tautan');
  if (!tautanValid(tautan)) kembali(tujuan, { err: 'Tautan harus diawali http:// atau https://' });
  let file: { path: string; nama: string } | null = null;
  try {
    file = await simpanFile(fd.get('file'), 'pengumpulan');
  } catch (e) {
    kembali(tujuan, { err: (e as Error).message });
  }
  if (!jawaban && !file && !tautan) kembali(tujuan, { err: 'Isi jawaban, unggah file, atau tempel tautan.' });

  await sql`
    insert into pengumpulan (tugas_id, siswa_id, jawaban, file_path, file_nama, tautan, dikirim_pada, terlambat)
    values (${id}, ${user.id}, ${jawaban || null}, ${file?.path ?? null}, ${file?.nama ?? null}, ${tautan || null}, now(), ${lewat})
    on conflict (tugas_id, siswa_id) do update set
      jawaban = excluded.jawaban,
      file_path = coalesce(excluded.file_path, pengumpulan.file_path),
      file_nama = coalesce(excluded.file_nama, pengumpulan.file_nama),
      tautan = excluded.tautan, dikirim_pada = now(), terlambat = excluded.terlambat`;
  kembali(tujuan, { ok: lewat ? 'Tugas terkirim (tercatat terlambat).' : 'Tugas berhasil dikumpulkan.' });
}

/** KF-22, KF-23: guru memberi nilai dan komentar. Nilai otomatis masuk komponen Tugas. */
export async function nilaiTugas(fd: FormData) {
  const user = await requireUser(['guru']);
  const id = Number(fd.get('id'));
  await tugasMilikGuru(user.id, id);
  const daftar = await sql`select id, siswa_id from pengumpulan where tugas_id = ${id}`;
  let jumlah = 0;
  for (const pg of daftar) {
    const n = angka(fd, `nilai_${pg.id}`);
    const kom = teks(fd, `komentar_${pg.id}`) || null;
    if (n != null && (n < 0 || n > 100)) kembali(`/tugas/${id}`, { err: 'Nilai harus 0–100.' });
    await sql`update pengumpulan set nilai = ${n}, komentar = ${kom}, dinilai_pada = ${n == null ? null : sql`now()`} where id = ${pg.id}`;
    if (n != null) jumlah++;
  }
  kembali(`/tugas/${id}`, { ok: `Penilaian tersimpan (${jumlah} siswa dinilai).` });
}
