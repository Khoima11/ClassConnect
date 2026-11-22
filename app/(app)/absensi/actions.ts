'use server';

import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { kembali } from '@/lib/flash';
import { kirimNotif } from '@/lib/notify';
import { fmtTanggal, todayWIB } from '@/lib/time';

/** KF-14, KF-15: simpan absensi satu pertemuan. */
export async function simpanAbsensi(fd: FormData) {
  const user = await requireUser(['guru', 'admin']);
  const jadwalId = Number(fd.get('jadwal_id'));
  const tanggal = String(fd.get('tanggal'));
  const tujuan = `/absensi/isi/${jadwalId}?tanggal=${tanggal}`;

  const [j] = await sql`
    select j.id, p.guru_id, p.kelas_id, m.nama as mapel, k.wali_kelas_id
    from jadwal j join pengampu p on p.id = j.pengampu_id join mapel m on m.id = p.mapel_id join kelas k on k.id = p.kelas_id
    where j.id = ${jadwalId}`;
  if (!j || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) kembali('/absensi', { err: 'Jadwal tidak ditemukan.' });

  const hariIni = todayWIB();
  const gurunya = user.peran === 'guru' && j.guru_id === user.id;
  const koreksi = user.peran === 'admin' || (user.peran === 'guru' && j.wali_kelas_id === user.id);
  if (tanggal > hariIni) kembali(tujuan, { err: 'Absensi belum bisa diisi untuk tanggal yang akan datang.' });
  if (!koreksi && !(gurunya && tanggal === hariIni)) {
    kembali(tujuan, { err: 'Absensi hanya bisa diubah guru mapel pada hari yang sama. Setelah itu, hubungi wali kelas atau admin.' });
  }

  const siswa = await sql`select user_id from siswa where kelas_id = ${j.kelas_id}`;
  const [pt] = await sql`
    insert into pertemuan (jadwal_id, tanggal) values (${jadwalId}, ${tanggal})
    on conflict (jadwal_id, tanggal) do update set tanggal = excluded.tanggal returning id`;
  const sebelumnya = await sql`select siswa_id, status from absensi where pertemuan_id = ${pt.id}`;

  const baris = siswa.map((s) => {
    const st = String(fd.get(`status_${s.user_id}`) ?? 'H');
    return {
      pertemuan_id: pt.id,
      siswa_id: s.user_id,
      status: ['H', 'S', 'I', 'A'].includes(st) ? st : 'H',
      keterangan: String(fd.get(`ket_${s.user_id}`) ?? '').trim() || null,
      diubah_oleh: user.id,
    };
  });
  if (baris.length) {
    await sql`
      insert into absensi ${sql(baris, 'pertemuan_id', 'siswa_id', 'status', 'keterangan', 'diubah_oleh')}
      on conflict (pertemuan_id, siswa_id) do update
      set status = excluded.status, keterangan = excluded.keterangan, diubah_oleh = excluded.diubah_oleh, diubah = now()`;
  }

  // Orang tua siswa yang baru tercatat Alpa mendapat notifikasi.
  const alpaBaru = baris
    .filter((b) => b.status === 'A' && sebelumnya.find((s) => s.siswa_id === b.siswa_id)?.status !== 'A')
    .map((b) => b.siswa_id);
  for (const sid of alpaBaru) {
    const ortu = await sql`select ortu_id from ortu_siswa where siswa_id = ${sid}`;
    const [s] = await sql`select nama from users where id = ${sid}`;
    await kirimNotif(ortu.map((o) => o.ortu_id), 'absensi', `${s.nama} tercatat Alpa di ${j.mapel}, ${fmtTanggal(tanggal)}`, '/absensi', `alpa-${pt.id}-${sid}`);
  }
  kembali(tujuan, { ok: 'Absensi tersimpan.' });
}
