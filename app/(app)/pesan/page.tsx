import Link from 'next/link';
import { Judul, Kartu, Kosong, Lencana } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sql } from '@/lib/db';
import { fmtWaktu } from '@/lib/time';

export const dynamic = 'force-dynamic';

export default async function HalamanPesan({ searchParams }: { searchParams: Promise<{ kelas?: string }> }) {
  const user = await requireUser(['guru', 'ortu']);
  const sp = await searchParams;

  const utas = await sql`
    select distinct on (lawan, x.siswa_id) lawan, x.siswa_id, x.isi, x.dibuat, x.pengirim_id,
      ul.nama as lawan_nama, us.nama as siswa_nama, k.nama as kelas,
      (select count(*)::int from pesan_langsung y where y.penerima_id = ${user.id} and y.pengirim_id = lawan and y.siswa_id = x.siswa_id and not y.dibaca) as baru
    from (
      select *, case when pengirim_id = ${user.id} then penerima_id else pengirim_id end as lawan
      from pesan_langsung where pengirim_id = ${user.id} or penerima_id = ${user.id}
    ) x
    join users ul on ul.id = x.lawan join users us on us.id = x.siswa_id
    left join siswa s on s.user_id = x.siswa_id left join kelas k on k.id = s.kelas_id
    order by lawan, x.siswa_id, x.dibuat desc`;
  utas.sort((a, b) => +new Date(b.dibuat) - +new Date(a.dibuat));

  let kontak: any[] = [];
  let kelasPilihan: any[] = [];
  let kelasId: number | null = null;
  if (user.peran === 'ortu' && user.anakAktif?.kelas_id) {
    kontak = await sql`
      select g.id, g.nama, string_agg(m.nama, ', ' order by m.nama) as mapel, bool_or(k.wali_kelas_id = g.id) as wali
      from kelas k join pengampu p on p.kelas_id = k.id join users g on g.id = p.guru_id join mapel m on m.id = p.mapel_id
      where k.id = ${user.anakAktif.kelas_id}
      group by g.id, g.nama order by bool_or(k.wali_kelas_id = g.id) desc, g.nama`;
  }
  if (user.peran === 'guru') {
    kelasPilihan = await sql`
      select id, nama from kelas where wali_kelas_id = ${user.id} or id in (select kelas_id from pengampu where guru_id = ${user.id}) order by tingkat, nama`;
    kelasId = Number(sp.kelas) || kelasPilihan[0]?.id || null;
    if (kelasId && kelasPilihan.some((k) => k.id === kelasId)) {
      kontak = await sql`
        select o.id, o.nama, us.id as siswa_id, us.nama as siswa_nama, os.hubungan
        from siswa s join users us on us.id = s.user_id join ortu_siswa os on os.siswa_id = us.id join users o on o.id = os.ortu_id
        where s.kelas_id = ${kelasId} order by us.nama`;
    }
  }

  return (
    <>
      <Judul judul={user.peran === 'guru' ? 'Pesan Orang Tua' : 'Pesan ke Guru'} sub="Percakapan langsung orang tua dengan guru dan wali kelas" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Kartu judul="Percakapan">
          {utas.length === 0 ? <Kosong>Belum ada percakapan.</Kosong> : (
            <ul className="divide-y divide-slate-100">
              {utas.map((u) => (
                <li key={`${u.lawan}-${u.siswa_id}`}>
                  <Link href={`/pesan/${u.lawan}?siswa=${u.siswa_id}`} className="flex items-start justify-between gap-2 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{u.lawan_nama}</p>
                      <p className="text-xs text-slate-500">Tentang {u.siswa_nama} ({u.kelas ?? '-'})</p>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-600">{u.pengirim_id === user.id ? 'Anda: ' : ''}{u.isi}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[11px] text-slate-400">{fmtWaktu(u.dibuat)}</p>
                      {u.baru > 0 && <Lencana warna="merah">{u.baru} baru</Lencana>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Kartu>
        <Kartu
          judul="Mulai percakapan baru"
          aksi={user.peran === 'guru' && kelasPilihan.length > 0 && (
            <form className="flex gap-2">
              <select name="kelas" defaultValue={kelasId ?? ''} className="input w-auto py-1 text-xs">{kelasPilihan.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}</select>
              <button className="btn-secondary btn-sm">Pilih</button>
            </form>
          )}
        >
          {kontak.length === 0 ? <Kosong>Tidak ada kontak.</Kosong> : (
            <ul className="divide-y divide-slate-100">
              {user.peran === 'ortu'
                ? kontak.map((k) => (
                    <li key={k.id} className="flex items-center justify-between gap-2 py-2">
                      <div><p className="text-sm font-medium">{k.nama} {k.wali && <Lencana warna="biru">Wali kelas</Lencana>}</p><p className="text-xs text-slate-500">{k.mapel}</p></div>
                      <Link href={`/pesan/${k.id}?siswa=${user.anakAktif!.id}`} className="btn-secondary btn-sm">Kirim pesan</Link>
                    </li>
                  ))
                : kontak.map((k) => (
                    <li key={`${k.id}-${k.siswa_id}`} className="flex items-center justify-between gap-2 py-2">
                      <div><p className="text-sm font-medium">{k.nama}</p><p className="text-xs text-slate-500">{k.hubungan} dari {k.siswa_nama}</p></div>
                      <Link href={`/pesan/${k.id}?siswa=${k.siswa_id}`} className="btn-secondary btn-sm">Kirim pesan</Link>
                    </li>
                  ))}
            </ul>
          )}
        </Kartu>
      </div>
    </>
  );
}
