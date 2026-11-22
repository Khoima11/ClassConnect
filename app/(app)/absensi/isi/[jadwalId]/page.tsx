import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TombolKirim } from '@/components/client';
import { Judul, Kartu, Lencana } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { daftarSiswaKelas } from '@/lib/data';
import { sql } from '@/lib/db';
import { NAMA_HARI, fmtTanggal, fmtWaktu, hariDari, jam, tambahHari, todayWIB } from '@/lib/time';
import { simpanAbsensi } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function IsiAbsensi({ params, searchParams }: { params: Promise<{ jadwalId: string }>; searchParams: Promise<{ tanggal?: string }> }) {
  const user = await requireUser(['guru', 'admin']);
  const { jadwalId } = await params;
  const sp = await searchParams;
  const hariIni = todayWIB();

  const [j] = await sql`
    select j.id, j.hari, j.jam_ke, j.jam_mulai, j.jam_selesai, p.guru_id, p.kelas_id, m.nama as mapel, k.nama as kelas, k.wali_kelas_id, g.nama as guru
    from jadwal j join pengampu p on p.id = j.pengampu_id join mapel m on m.id = p.mapel_id
    join kelas k on k.id = p.kelas_id join users g on g.id = p.guru_id
    where j.id = ${Number(jadwalId)}`;
  if (!j) redirect('/absensi');

  const gurunya = user.peran === 'guru' && j.guru_id === user.id;
  const koreksi = user.peran === 'admin' || (user.peran === 'guru' && j.wali_kelas_id === user.id);
  if (!gurunya && !koreksi) redirect('/tidak-diizinkan');

  // Bawaan: hari ini jika jadwalnya hari ini, selain itu pertemuan terakhir sesuai hari jadwal.
  let tanggal = sp.tanggal && /^\d{4}-\d{2}-\d{2}$/.test(sp.tanggal) ? sp.tanggal : hariIni;
  if (!sp.tanggal && hariDari(hariIni) !== j.hari) {
    let t = hariIni;
    while (hariDari(t) !== j.hari) t = tambahHari(t, -1);
    tanggal = t;
  }
  const bisaUbah = koreksi || (gurunya && tanggal === hariIni);
  const cocokHari = hariDari(tanggal) === j.hari;

  const siswa = await daftarSiswaKelas(j.kelas_id);
  const [pt] = await sql`select id from pertemuan where jadwal_id = ${j.id} and tanggal = ${tanggal}`;
  const absen = pt
    ? await sql`select a.siswa_id, a.status, a.keterangan, a.diubah, u.nama as oleh from absensi a left join users u on u.id = a.diubah_oleh where a.pertemuan_id = ${pt.id}`
    : [];
  const terakhir = absen.reduce<any>((a, b) => (!a || b.diubah > a.diubah ? b : a), null);

  return (
    <>
      <Judul
        judul={`Absensi ${j.mapel} · ${j.kelas}`}
        sub={`${fmtTanggal(tanggal)} · Jam ke-${j.jam_ke} (${jam(j.jam_mulai)}–${jam(j.jam_selesai)}) · ${j.guru}`}
        aksi={<Link href="/absensi" className="btn-secondary">Kembali</Link>}
      />
      {koreksi && (
        <form className="mb-4 flex flex-wrap items-end gap-2">
          <label>
            <span className="label">Tanggal (koreksi wali kelas/admin)</span>
            <input type="date" name="tanggal" defaultValue={tanggal} max={hariIni} className="input" />
          </label>
          <button className="btn-secondary">Buka</button>
        </form>
      )}
      {!cocokHari && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Jadwal ini berlangsung setiap hari {NAMA_HARI[j.hari]}, sedangkan tanggal yang dipilih jatuh pada hari {NAMA_HARI[hariDari(tanggal)]}.
        </p>
      )}
      {!bisaUbah && (
        <p className="mb-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-600">
          Hanya bisa dilihat. Guru mapel dapat mengisi atau mengubah absensi pada hari yang sama; setelah itu koreksi dilakukan wali kelas atau admin.
        </p>
      )}
      <Kartu>
        <form action={simpanAbsensi}>
          <input type="hidden" name="jadwal_id" value={j.id} />
          <input type="hidden" name="tanggal" value={tanggal} />
          <p className="mb-3 text-sm text-slate-500">
            {pt ? (
              <>Sudah diisi{terakhir && ` · terakhir diubah ${fmtWaktu(terakhir.diubah)} oleh ${terakhir.oleh ?? '-'}`}</>
            ) : (
              <>Belum diisi. Semua siswa diisi <b>Hadir</b> sebagai bawaan; ubah yang tidak hadir saja.</>
            )}
          </p>
          <div className="divide-y divide-slate-100">
            {siswa.map((s, i) => {
              const a = absen.find((x) => x.siswa_id === s.id);
              const st = a?.status ?? 'H';
              return (
                <div key={s.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{i + 1}. {s.nama}</p>
                    <p className="text-xs text-slate-400">NISN {s.nisn}</p>
                  </div>
                  <div className="flex gap-1">
                    {(['H', 'S', 'I', 'A'] as const).map((k) => (
                      <label key={k} className="cursor-pointer">
                        <input type="radio" name={`status_${s.id}`} value={k} defaultChecked={st === k} disabled={!bisaUbah} className="peer sr-only" />
                        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold peer-checked:text-white peer-disabled:cursor-not-allowed ${
                          { H: 'peer-checked:border-hijau-600 peer-checked:bg-hijau-600', S: 'peer-checked:border-amber-500 peer-checked:bg-amber-500', I: 'peer-checked:border-navy-600 peer-checked:bg-navy-600', A: 'peer-checked:border-red-600 peer-checked:bg-red-600' }[k]
                        } border-slate-300 text-slate-600`}>{k}</span>
                      </label>
                    ))}
                  </div>
                  <input name={`ket_${s.id}`} defaultValue={a?.keterangan ?? ''} placeholder="Keterangan (opsional)" disabled={!bisaUbah} className="input sm:w-56" />
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              <Lencana warna="hijau">H</Lencana> Hadir · <Lencana warna="kuning">S</Lencana> Sakit · <Lencana warna="biru">I</Lencana> Izin · <Lencana warna="merah">A</Lencana> Alpa
            </p>
            {bisaUbah && <TombolKirim className="btn-hijau">Simpan Absensi</TombolKirim>}
          </div>
        </form>
      </Kartu>
    </>
  );
}
