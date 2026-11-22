import Link from 'next/link';
import { Judul, Kartu, Kosong, Lencana } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { filterPengumuman } from '@/lib/data';
import { sql } from '@/lib/db';
import { fmtWaktu } from '@/lib/time';
import { labelSasaran } from '@/lib/types';

export const dynamic = 'force-dynamic';


export default async function HalamanPengumuman() {
  const user = await requireUser();
  const data = await sql`
    select pg.id, pg.judul, pg.isi, pg.dibuat, pg.disematkan, pg.sasaran_peran, pg.tayang_mulai, pg.tayang_akhir,
      k.nama as kelas, u.nama as pembuat,
      exists (select 1 from pengumuman_dibaca d where d.pengumuman_id = pg.id and d.user_id = ${user.id}) as dibaca
    from pengumuman pg left join kelas k on k.id = pg.sasaran_kelas_id left join users u on u.id = pg.pembuat_id
    where ${filterPengumuman(user)}
    order by pg.disematkan desc, pg.tayang_mulai desc`;
  const bisaBuat = ['admin', 'kepala', 'guru'].includes(user.peran);
  const sekarang = new Date();
  return (
    <>
      <Judul judul="Pengumuman" sub={`${data.filter((d) => !d.dibaca).length} belum dibaca`} aksi={bisaBuat && <Link href="/pengumuman/baru" className="btn-primary">+ Buat Pengumuman</Link>} />
      {data.length === 0 ? <Kosong>Belum ada pengumuman.</Kosong> : (
        <div className="space-y-3">
          {data.map((p) => {
            const belumTayang = new Date(p.tayang_mulai) > sekarang;
            const berakhir = p.tayang_akhir && new Date(p.tayang_akhir) < sekarang;
            return (
              <Link key={p.id} href={`/pengumuman/${p.id}`} className={`card block hover:border-emas-400 ${!p.dibaca ? 'border-l-4 border-l-emas-500' : ''}`}>
                <div className="flex flex-wrap items-center gap-2">
                  {p.disematkan && <Lencana warna="kuning">Disematkan</Lencana>}
                  {!p.dibaca && <Lencana warna="biru">Baru</Lencana>}
                  {belumTayang && <Lencana>Terjadwal</Lencana>}
                  {berakhir && <Lencana>Berakhir</Lencana>}
                  <span className="text-xs text-slate-400">{labelSasaran(p.sasaran_peran, p.kelas)}</span>
                </div>
                <h2 className="mt-1 font-semibold">{p.judul}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.isi}</p>
                <p className="mt-2 text-xs text-slate-400">{p.pembuat ?? '-'} · {fmtWaktu(p.tayang_mulai)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
