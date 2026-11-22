import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Judul, Kartu, Kosong, Lencana, TabelWadah, nilaiTampil } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { kelasMilik, nilaiSiswa, pengampuGuru, siswaMilik } from '@/lib/data';
import { predikat } from '@/lib/nilai';

export const dynamic = 'force-dynamic';

export default async function HalamanNilai() {
  const user = await requireUser();
  if (user.peran === 'admin' || user.peran === 'kepala') redirect('/rekap?tab=nilai');

  if (user.peran === 'guru') {
    const daftar = await pengampuGuru(user.id);
    return (
      <>
        <Judul judul="Nilai" sub="Pilih kelas dan mapel untuk mengisi nilai" aksi={user.waliKelas.length > 0 && <Link href="/rekap?tab=nilai" className="btn-secondary">Rekap kelas perwalian</Link>} />
        {daftar.length === 0 ? <Kosong>Belum ada kelas yang Anda ajar.</Kosong> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {daftar.map((p) => (
              <Link key={p.id} href={`/nilai/${p.id}`} className="card hover:border-emas-400">
                <p className="font-semibold text-navy-900">{p.mapel_nama}</p>
                <p className="text-sm text-slate-500">Kelas {p.kelas_nama}</p>
                <div className="mt-2">{p.nilai_terbit ? <Lencana warna="hijau">Terbit</Lencana> : <Lencana warna="kuning">Draf</Lencana>}</div>
              </Link>
            ))}
          </div>
        )}
      </>
    );
  }

  const siswaId = siswaMilik(user);
  const kelasId = kelasMilik(user);
  if (!siswaId || !kelasId) return <Kosong>Data kelas belum terhubung.</Kosong>;
  const { hasil, bobot } = await nilaiSiswa(siswaId, kelasId, true);
  return (
    <>
      <Judul
        judul={user.peran === 'ortu' ? `Nilai ${user.anakAktif?.nama}` : 'Nilai Saya'}
        sub={`Bobot nilai akhir: Tugas ${bobot.tugas}% · UH ${bobot.uh}% · PTS ${bobot.pts}% · PAS ${bobot.pas}%`}
      />
      <Kartu>
        <TabelWadah>
          <table className="tabel">
            <thead><tr><th>Mapel</th><th>Tugas</th><th>Rata-rata UH</th><th>PTS</th><th>PAS</th><th>Nilai akhir</th><th>Predikat</th></tr></thead>
            <tbody>
              {hasil.map(({ p, baris }) => (
                <tr key={p.id}>
                  <td><p className="font-medium">{p.mapel_nama}</p><p className="text-xs text-slate-400">{p.guru_nama}</p></td>
                  {baris ? (
                    <>
                      <td>{nilaiTampil(baris.tugas)}</td>
                      <td>{nilaiTampil(baris.uh.filter((x): x is number => x != null).length ? baris.uh.filter((x): x is number => x != null).reduce((a, b) => a + b, 0) / baris.uh.filter((x) => x != null).length : null)}</td>
                      <td>{nilaiTampil(baris.pts)}</td>
                      <td>{nilaiTampil(baris.pas)}</td>
                      <td className="font-semibold">{nilaiTampil(baris.akhir)} {!baris.lengkap && baris.akhir != null && <span className="text-[11px] font-normal text-slate-400">(sementara)</span>}</td>
                      <td>{predikat(baris.akhir)}</td>
                    </>
                  ) : (
                    <td colSpan={6} className="text-slate-400">Belum diterbitkan guru</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </TabelWadah>
        <p className="mt-3 text-xs text-slate-500">
          &quot;Sementara&quot; berarti ada komponen yang belum dinilai (misalnya PAS), sehingga bobotnya dibagi ke komponen yang sudah ada. Nilai di sini bukan pengganti rapor resmi madrasah.
        </p>
      </Kartu>
    </>
  );
}
