'use server';

import { requireUser } from '@/lib/auth';
import { cekPengampu, daftarSiswaKelas } from '@/lib/data';
import { sql } from '@/lib/db';
import { angka, kembali } from '@/lib/flash';
import { kirimNotif, ortuDariSiswa } from '@/lib/notify';

/** KF-24: simpan nilai UH, PTS, PAS satu kelas sekaligus. */
export async function simpanNilai(fd: FormData) {
  const user = await requireUser(['guru']);
  const p = await cekPengampu(user, Number(fd.get('pengampu_id')), 'tulis');
  const jumlahUH = Math.min(10, Math.max(1, Number(fd.get('jumlah_uh')) || 1));
  const tujuan = `/nilai/${p.id}?uh=${jumlahUH}`;
  const siswa = await daftarSiswaKelas(p.kelas_id);

  const kolom: [string, number][] = [...Array.from({ length: jumlahUH }, (_, i) => ['UH', i + 1] as [string, number]), ['PTS', 1], ['PAS', 1]];
  await sql.begin(async (tx) => {
    for (const s of siswa) {
      for (const [komponen, urutan] of kolom) {
        const nama = komponen === 'UH' ? `uh${urutan}_${s.id}` : `${komponen.toLowerCase()}_${s.id}`;
        const n = angka(fd, nama);
        if (n == null) {
          await tx`delete from nilai where pengampu_id = ${p.id} and siswa_id = ${s.id} and komponen = ${komponen} and urutan = ${urutan}`;
        } else {
          if (n < 0 || n > 100) throw new Error('Nilai harus 0–100');
          await tx`
            insert into nilai (pengampu_id, siswa_id, komponen, urutan, nilai) values (${p.id}, ${s.id}, ${komponen}, ${urutan}, ${n})
            on conflict (pengampu_id, siswa_id, komponen, urutan) do update set nilai = excluded.nilai`;
        }
      }
    }
  }).catch((e) => kembali(tujuan, { err: e.message }));
  kembali(tujuan, { ok: p.nilai_terbit ? 'Nilai tersimpan dan langsung terlihat siswa (status: terbit).' : 'Nilai tersimpan sebagai draf.' });
}

/** KF-26: terbitkan / tarik nilai. */
export async function aturTerbit(fd: FormData) {
  const user = await requireUser(['guru']);
  const p = await cekPengampu(user, Number(fd.get('pengampu_id')), 'tulis');
  const terbit = fd.get('terbit') === '1';
  await sql`update pengampu set nilai_terbit = ${terbit} where id = ${p.id}`;
  if (terbit) {
    const siswa = (await daftarSiswaKelas(p.kelas_id)).map((s) => s.id);
    await kirimNotif([...siswa, ...(await ortuDariSiswa(siswa))], 'nilai', `Nilai ${p.mapel_nama} kelas ${p.kelas_nama} sudah terbit`, '/nilai');
  }
  kembali(`/nilai/${p.id}`, { ok: terbit ? 'Nilai diterbitkan. Siswa dan orang tua sudah diberi notifikasi.' : 'Nilai ditarik kembali menjadi draf.' });
}
