import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TombolKirim } from '@/components/client';
import { Judul, Kartu, Lencana } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { filterPengumuman } from '@/lib/data';
import { sql } from '@/lib/db';
import { linkFile } from '@/lib/storage';
import { fmtWaktu } from '@/lib/time';
import { hapusPengumuman, sematkan } from '../actions';
import { labelSasaran } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function DetailPengumuman({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [p] = await sql`
    select pg.*, k.nama as kelas, u.nama as pembuat from pengumuman pg
    left join kelas k on k.id = pg.sasaran_kelas_id left join users u on u.id = pg.pembuat_id
    where pg.id = ${Number(id)} and ${filterPengumuman(user)}`;
  if (!p) redirect('/pengumuman');
  await sql`insert into pengumuman_dibaca (pengumuman_id, user_id) values (${p.id}, ${user.id}) on conflict do nothing`;
  const [{ n }] = await sql`select count(*)::int as n from pengumuman_dibaca where pengumuman_id = ${p.id}`;
  const bisaHapus = user.peran === 'admin' || p.pembuat_id === user.id;

  return (
    <>
      <Judul judul={p.judul} aksi={<Link href="/pengumuman" className="btn-secondary">Kembali</Link>} />
      <Kartu className="max-w-3xl">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {p.disematkan && <Lencana warna="kuning">Disematkan</Lencana>}
          <Lencana>Untuk: {labelSasaran(p.sasaran_peran, p.kelas)}</Lencana>
          <span>{p.pembuat ?? '-'} · {fmtWaktu(p.tayang_mulai)}</span>
          {p.tayang_akhir && <span>· tayang sampai {fmtWaktu(p.tayang_akhir)}</span>}
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed">{p.isi}</p>
        {p.lampiran_path && (
          <a href={linkFile(p.lampiran_path)!} target="_blank" className="btn-secondary btn-sm mt-4">📎 {p.lampiran_nama ?? 'Lampiran'}</a>
        )}
        {(bisaHapus || user.peran === 'kepala') && (
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="mr-auto text-xs text-slate-500">Sudah dibaca {n} orang</span>
            {(user.peran === 'admin' || user.peran === 'kepala') && (
              <form action={sematkan}><input type="hidden" name="id" value={p.id} /><TombolKirim className="btn-secondary btn-sm">{p.disematkan ? 'Lepas sematan' : 'Sematkan'}</TombolKirim></form>
            )}
            {bisaHapus && (
              <form action={hapusPengumuman}><input type="hidden" name="id" value={p.id} /><TombolKirim className="btn-danger btn-sm" konfirmasi="Hapus pengumuman ini?">Hapus</TombolKirim></form>
            )}
          </div>
        )}
      </Kartu>
    </>
  );
}
