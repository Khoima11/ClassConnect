import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { TombolKirim } from '@/components/client';
import { Judul, Kartu, Kosong } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { fmtWaktu } from '@/lib/time';

export const dynamic = 'force-dynamic';

const IKON: Record<string, string> = { tugas: '📝', tenggat: '⏰', nilai: '🎯', pengumuman: '📢', pesan: '✉️', absensi: '✅' };

async function tandaiSemua() {
  'use server';
  const user = await requireUser();
  await sql`update notifikasi set dibaca = true where user_id = ${user.id} and not dibaca`;
  revalidatePath('/', 'layout');
}

export default async function HalamanNotifikasi() {
  const user = await requireUser();
  const data = await sql`select * from notifikasi where user_id = ${user.id} order by dibuat desc limit 100`;
  // Notifikasi lebih dari 90 hari dihapus otomatis agar database tetap ringan.
  await sql`delete from notifikasi where user_id = ${user.id} and dibuat < now() - interval '90 days'`;
  const baru = data.filter((n) => !n.dibaca).length;
  return (
    <>
      <Judul
        judul="Notifikasi"
        sub={`${baru} belum dibaca`}
        aksi={baru > 0 && <form action={tandaiSemua}><TombolKirim className="btn-secondary">Tandai semua dibaca</TombolKirim></form>}
      />
      <Kartu>
        {data.length === 0 ? <Kosong>Belum ada notifikasi.</Kosong> : (
          <ul className="divide-y divide-slate-100">
            {data.map((n) => (
              <li key={n.id}>
                <Link href={`/notifikasi/buka?id=${n.id}`} className={`flex items-start gap-3 px-1 py-3 hover:bg-slate-50 ${n.dibaca ? 'opacity-70' : ''}`}>
                  <span className="text-lg">{IKON[n.jenis] ?? '🔔'}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${n.dibaca ? '' : 'font-semibold'}`}>{n.judul}</p>
                    <p className="text-xs text-slate-400">{fmtWaktu(n.dibuat)}</p>
                  </div>
                  {!n.dibaca && <span className="mt-1.5 h-2 w-2 rounded-full bg-navy-600" />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Kartu>
    </>
  );
}
