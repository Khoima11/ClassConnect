import { Judul, Kartu, Kosong, TabelWadah } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { kelasMilik, semuaKelas } from '@/lib/data';
import { sql } from '@/lib/db';
import { NAMA_HARI, hariDari, jam, todayWIB } from '@/lib/time';

export const dynamic = 'force-dynamic';

export default async function HalamanJadwal({ searchParams }: { searchParams: Promise<{ kelas?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const kelasList = await semuaKelas();
  let kelasId: number | null = null;
  let modeGuru = false;
  let judul = 'Jadwal Pelajaran';

  if (user.peran === 'siswa' || user.peran === 'ortu') {
    kelasId = kelasMilik(user);
  } else if (user.peran === 'guru' && !sp.kelas) {
    modeGuru = true;
    judul = 'Jadwal Mengajar';
  } else {
    kelasId = Number(sp.kelas) || kelasList[0]?.id || null;
  }

  const data = await sql`
    select j.id, j.hari, j.jam_ke, j.jam_mulai, j.jam_selesai, m.nama as mapel, k.nama as kelas, g.nama as guru
    from jadwal j join pengampu p on p.id = j.pengampu_id join mapel m on m.id = p.mapel_id
    join kelas k on k.id = p.kelas_id join users g on g.id = p.guru_id
    where ${modeGuru ? sql`p.guru_id = ${user.id}` : sql`p.kelas_id = ${kelasId ?? -1}`}
    order by j.hari, j.jam_ke`;
  const maksJam = Math.max(4, ...data.map((d) => d.jam_ke));
  const hariIni = hariDari(todayWIB());
  const kelasNama = kelasList.find((k) => k.id === kelasId)?.nama;
  const bolehPilih = user.peran === 'admin' || user.peran === 'kepala' || user.peran === 'guru';

  return (
    <>
      <Judul
        judul={judul}
        sub={modeGuru ? 'Semua kelas yang Anda ajar' : `Kelas ${kelasNama ?? '-'}`}
        aksi={
          bolehPilih && (
            <form className="flex gap-2">
              <select name="kelas" defaultValue={kelasId ?? ''} className="input w-auto">
                {user.peran === 'guru' && <option value="">Jadwal mengajar saya</option>}
                {kelasList.map((k) => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}
              </select>
              <button className="btn-secondary">Tampilkan</button>
            </form>
          )
        }
      />
      <Kartu>
        {data.length === 0 ? (
          <Kosong>Belum ada jadwal.</Kosong>
        ) : (
          <TabelWadah>
            <table className="tabel min-w-[720px]">
              <thead>
                <tr>
                  <th className="w-20">Jam</th>
                  {[1, 2, 3, 4, 5, 6].map((h) => (
                    <th key={h} className={h === hariIni ? 'bg-navy-50 text-navy-700' : ''}>{NAMA_HARI[h]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maksJam }, (_, i) => i + 1).map((jk) => (
                  <tr key={jk}>
                    <td className="text-xs text-slate-500">Ke-{jk}</td>
                    {[1, 2, 3, 4, 5, 6].map((h) => {
                      const sel = data.filter((d) => d.hari === h && d.jam_ke === jk);
                      return (
                        <td key={h} className={h === hariIni ? 'bg-navy-50/50' : ''}>
                          {sel.map((d) => (
                            <div key={d.id} className="rounded-md bg-white p-1.5 ring-1 ring-slate-200">
                              <p className="text-xs font-semibold text-navy-900">{d.mapel}</p>
                              <p className="text-[11px] text-slate-500">{modeGuru ? d.kelas : d.guru}</p>
                              <p className="text-[11px] text-slate-400">{jam(d.jam_mulai)}–{jam(d.jam_selesai)}</p>
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </TabelWadah>
        )}
      </Kartu>
    </>
  );
}
