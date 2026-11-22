import { TombolKirim } from '@/components/client';
import { Judul, Kartu, Kosong } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { fmtWaktu } from '@/lib/time';
import { tindakLaporan } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Laporan() {
  await requireUser(['admin']);
  const diskusi = await sql`
    select d.id, d.isi, d.dibuat, u.nama, m.nama as mapel, k.nama as kelas
    from pesan_diskusi d join users u on u.id = d.pengirim_id join pengampu p on p.id = d.pengampu_id
    join mapel m on m.id = p.mapel_id join kelas k on k.id = p.kelas_id
    where d.dilaporkan and not d.dihapus order by d.dibuat desc`;
  const langsung = await sql`
    select pl.id, pl.isi, pl.dibuat, a.nama as dari, b.nama as ke
    from pesan_langsung pl join users a on a.id = pl.pengirim_id join users b on b.id = pl.penerima_id
    where pl.dilaporkan order by pl.dibuat desc`;
  const Item = ({ jenis, id, judul, isi, waktu }: { jenis: string; id: number; judul: string; isi: string; waktu: Date }) => (
    <li className="py-3">
      <p className="text-xs text-slate-500">{judul} · {fmtWaktu(waktu)}</p>
      <p className="mt-1 rounded-lg bg-slate-50 p-2 text-sm">{isi}</p>
      <div className="mt-2 flex gap-2">
        <form action={tindakLaporan}><input type="hidden" name="jenis" value={jenis} /><input type="hidden" name="id" value={id} /><input type="hidden" name="aksi" value="hapus" /><TombolKirim className="btn-danger btn-sm" konfirmasi="Hapus pesan ini?">Hapus pesan</TombolKirim></form>
        <form action={tindakLaporan}><input type="hidden" name="jenis" value={jenis} /><input type="hidden" name="id" value={id} /><input type="hidden" name="aksi" value="abaikan" /><TombolKirim className="btn-secondary btn-sm">Abaikan</TombolKirim></form>
      </div>
    </li>
  );
  return (
    <>
      <Judul judul="Pesan Dilaporkan" sub="Admin hanya melihat pesan yang dilaporkan pengguna." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Kartu judul={`Diskusi kelas (${diskusi.length})`}>
          {diskusi.length === 0 ? <Kosong>Tidak ada laporan.</Kosong> : (
            <ul className="divide-y divide-slate-100">{diskusi.map((d) => <Item key={d.id} jenis="diskusi" id={d.id} judul={`${d.nama} di ${d.mapel} ${d.kelas}`} isi={d.isi} waktu={d.dibuat} />)}</ul>
          )}
        </Kartu>
        <Kartu judul={`Pesan langsung (${langsung.length})`}>
          {langsung.length === 0 ? <Kosong>Tidak ada laporan.</Kosong> : (
            <ul className="divide-y divide-slate-100">{langsung.map((d) => <Item key={d.id} jenis="langsung" id={d.id} judul={`${d.dari} → ${d.ke}`} isi={d.isi} waktu={d.dibuat} />)}</ul>
          )}
        </Kartu>
      </div>
    </>
  );
}
