import Link from 'next/link';
import { redirect } from 'next/navigation';
import { GulirKeBawah, TombolKirim } from '@/components/client';
import { Judul, Kartu, Kosong } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { fmtWaktu } from '@/lib/time';
import { hubunganSah } from '@/lib/data';
import { kirimPesan, laporkanPesan } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Percakapan({ params, searchParams }: { params: Promise<{ lawan: string }>; searchParams: Promise<{ siswa?: string }> }) {
  const user = await requireUser(['guru', 'ortu']);
  const lawan = Number((await params).lawan);
  const siswaId = Number((await searchParams).siswa);
  const [guruId, ortuId] = user.peran === 'guru' ? [user.id, lawan] : [lawan, user.id];
  if (!siswaId || !(await hubunganSah(guruId, ortuId, siswaId))) redirect('/tidak-diizinkan');

  const [info] = await sql`select (select nama from users where id = ${lawan}) as lawan, (select nama from users where id = ${siswaId}) as siswa`;
  await sql`update pesan_langsung set dibaca = true where penerima_id = ${user.id} and pengirim_id = ${lawan} and siswa_id = ${siswaId} and not dibaca`;
  const pesan = await sql`
    select * from pesan_langsung
    where siswa_id = ${siswaId} and ((pengirim_id = ${user.id} and penerima_id = ${lawan}) or (pengirim_id = ${lawan} and penerima_id = ${user.id}))
    order by dibuat`;
  const kembaliKe = `/pesan/${lawan}?siswa=${siswaId}`;

  return (
    <>
      <Judul judul={info.lawan} sub={`Tentang ${info.siswa}`} aksi={<Link href="/pesan" className="btn-secondary">Kembali</Link>} />
      <Kartu className="max-w-3xl">
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {pesan.length === 0 && <Kosong>Belum ada pesan. Tulis pesan pertama di bawah.</Kosong>}
          {pesan.map((m) => {
            const saya = m.pengirim_id === user.id;
            return (
              <div key={m.id} className={`flex ${saya ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${saya ? 'bg-navy-700 text-white' : 'bg-slate-100'}`}>
                  <p className="whitespace-pre-line">{m.isi}</p>
                  <div className={`mt-1 flex gap-2 text-[11px] ${saya ? 'text-navy-100' : 'text-slate-400'}`}>
                    {fmtWaktu(m.dibuat)}
                    {saya && (m.dibaca ? ' · dibaca' : ' · terkirim')}
                    {!saya && (m.dilaporkan ? <span>dilaporkan</span> : (
                      <form action={laporkanPesan}>
                        <input type="hidden" name="id" value={m.id} /><input type="hidden" name="kembali" value={kembaliKe} />
                        <button className="underline">laporkan</button>
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
        <form action={kirimPesan} className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
          <input type="hidden" name="lawan" value={lawan} />
          <input type="hidden" name="siswa" value={siswaId} />
          <input name="isi" className="input" placeholder="Tulis pesan..." maxLength={2000} autoComplete="off" required />
          <TombolKirim>Kirim</TombolKirim>
        </form>
      </Kartu>
    </>
  );
}
