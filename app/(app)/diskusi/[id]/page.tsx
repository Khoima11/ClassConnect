import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GulirKeBawah, TombolKirim } from '@/components/client';
import { Judul, Kartu, Kosong } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { cekPengampu } from '@/lib/data';
import { sql } from '@/lib/db';
import { fmtWaktu } from '@/lib/time';
import { hapusDiskusi, kirimDiskusi, kunciDiskusi, laporkanDiskusi } from '../actions';

export const dynamic = 'force-dynamic';

export default async function RuangDiskusi({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(['guru', 'siswa']);
  const { id } = await params;
  const p = await cekPengampu(user, Number(id), 'baca');
  const gurunya = user.peran === 'guru' && p.guru_id === user.id;
  if (!gurunya && user.peran !== 'siswa') redirect('/tidak-diizinkan');
  const pesan = await sql`
    select d.id, d.isi, d.dibuat, d.dihapus, d.dilaporkan, d.pengirim_id, u.nama, u.peran
    from pesan_diskusi d join users u on u.id = d.pengirim_id
    where d.pengampu_id = ${p.id} order by d.dibuat desc limit 200`;
  pesan.reverse();
  const bisaKirim = gurunya || !p.diskusi_terkunci;

  return (
    <>
      <Judul
        judul={`Diskusi ${p.mapel_nama} · ${p.kelas_nama}`}
        sub={`${p.guru_nama}${p.diskusi_terkunci ? ' · Diskusi dikunci guru' : ''}`}
        aksi={
          <>
            <Link href="/diskusi" className="btn-secondary">Kembali</Link>
            {gurunya && (
              <form action={kunciDiskusi}><input type="hidden" name="pengampu_id" value={p.id} /><TombolKirim className="btn-secondary">{p.diskusi_terkunci ? 'Buka diskusi' : 'Kunci diskusi'}</TombolKirim></form>
            )}
          </>
        }
      />
      <Kartu>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {pesan.length === 0 && <Kosong>Belum ada pesan. Mulai diskusi!</Kosong>}
          {pesan.map((m) => {
            const saya = m.pengirim_id === user.id;
            return (
              <div key={m.id} className={`flex ${saya ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${saya ? 'bg-navy-700 text-white' : m.peran === 'guru' ? 'bg-emas-100 ring-1 ring-emas-200' : 'bg-white ring-1 ring-slate-200'}`}>
                  {!saya && <p className="text-xs font-semibold">{m.nama}{m.peran === 'guru' && ' · Guru'}</p>}
                  <p className={`whitespace-pre-line ${m.dihapus ? 'italic opacity-60' : ''}`}>{m.dihapus ? 'Pesan dihapus' : m.isi}</p>
                  <div className={`mt-1 flex flex-wrap items-center gap-2 text-[11px] ${saya ? 'text-navy-100' : 'text-slate-400'}`}>
                    {fmtWaktu(m.dibuat)}
                    {!m.dihapus && (gurunya || saya) && (
                      <form action={hapusDiskusi}>
                        <input type="hidden" name="pengampu_id" value={p.id} /><input type="hidden" name="pesan_id" value={m.id} />
                        <button className="underline" type="submit">hapus</button>
                      </form>
                    )}
                    {!m.dihapus && !saya && (m.dilaporkan ? <span>dilaporkan</span> : (
                      <form action={laporkanDiskusi}>
                        <input type="hidden" name="pengampu_id" value={p.id} /><input type="hidden" name="pesan_id" value={m.id} />
                        <button className="underline" type="submit">laporkan</button>
                      </form>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          <div id="akhir" />
          <GulirKeBawah id="akhir" />
        </div>
        {bisaKirim ? (
          <form action={kirimDiskusi} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
            <input type="hidden" name="pengampu_id" value={p.id} />
            <input name="isi" className="input" placeholder="Tulis pesan..." maxLength={2000} autoComplete="off" required />
            <TombolKirim>Kirim</TombolKirim>
          </form>
        ) : (
          <p className="mt-4 border-t border-slate-100 pt-4 text-center text-sm text-slate-500">Diskusi sedang dikunci guru.</p>
        )}
      </Kartu>
    </>
  );
}
