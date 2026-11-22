import Link from 'next/link';
import { Judul, Kosong, Lencana } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { pengampuGuru, pengampuKelas } from '@/lib/data';
import { sql } from '@/lib/db';
import { fmtWaktu } from '@/lib/time';

export const dynamic = 'force-dynamic';

export default async function HalamanDiskusi() {
  const user = await requireUser(['guru', 'siswa']);
  const daftar = user.peran === 'guru' ? await pengampuGuru(user.id) : user.kelasId ? await pengampuKelas(user.kelasId) : [];
  const ids = daftar.map((p) => p.id);
  const terakhir = ids.length
    ? await sql`
        select distinct on (d.pengampu_id) d.pengampu_id, d.isi, d.dibuat, u.nama
        from pesan_diskusi d join users u on u.id = d.pengirim_id
        where d.pengampu_id in ${sql(ids)} and not d.dihapus
        order by d.pengampu_id, d.dibuat desc`
    : [];
  return (
    <>
      <Judul judul="Diskusi Kelas" sub="Ruang tanya jawab per kelas dan mapel. Semua pesan tercatat." />
      {daftar.length === 0 ? <Kosong>Belum ada ruang diskusi.</Kosong> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {daftar.map((p) => {
            const t = terakhir.find((x) => x.pengampu_id === p.id);
            return (
              <Link key={p.id} href={`/diskusi/${p.id}`} className="card block hover:border-emas-400">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-navy-900">{p.mapel_nama} {user.peran === 'guru' && <span className="font-normal text-slate-500">· {p.kelas_nama}</span>}</p>
                  {p.diskusi_terkunci && <Lencana>Dikunci</Lencana>}
                </div>
                <p className="text-xs text-slate-500">{user.peran === 'siswa' ? p.guru_nama : ''}</p>
                <p className="mt-2 line-clamp-1 text-sm text-slate-600">{t ? `${t.nama.split(' ')[0]}: ${t.isi}` : 'Belum ada pesan.'}</p>
                {t && <p className="text-[11px] text-slate-400">{fmtWaktu(t.dibuat)}</p>}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
