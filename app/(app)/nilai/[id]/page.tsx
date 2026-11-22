import Link from 'next/link';
import { TombolKirim } from '@/components/client';
import { Judul, Kartu, Kosong, Lencana, TabelWadah, nilaiTampil } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { bobotAktif, cekPengampu, nilaiPengampu } from '@/lib/data';
import { aturTerbit, simpanNilai } from '../actions';

export const dynamic = 'force-dynamic';

export default async function InputNilai({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ uh?: string }> }) {
  const user = await requireUser(['guru', 'admin', 'kepala']);
  const { id } = await params;
  const sp = await searchParams;
  const p = await cekPengampu(user, Number(id), 'baca');
  const pemilik = user.peran === 'guru' && p.guru_id === user.id;
  const bobot = await bobotAktif();
  const { baris, jumlahUH: adaUH } = await nilaiPengampu(p, bobot);
  const jumlahUH = Math.min(10, Math.max(adaUH, Number(sp.uh) || 0));

  return (
    <>
      <Judul
        judul={`Nilai ${p.mapel_nama} · ${p.kelas_nama}`}
        sub={<>Bobot: Tugas {bobot.tugas}% · UH {bobot.uh}% · PTS {bobot.pts}% · PAS {bobot.pas}% · Status {p.nilai_terbit ? <Lencana warna="hijau">Terbit</Lencana> : <Lencana warna="kuning">Draf</Lencana>}</>}
        aksi={
          <>
            <Link href={pemilik ? '/nilai' : `/rekap?tab=nilai&kelas=${p.kelas_id}`} className="btn-secondary">Kembali</Link>
            {pemilik && (
              <form action={aturTerbit}>
                <input type="hidden" name="pengampu_id" value={p.id} />
                <input type="hidden" name="terbit" value={p.nilai_terbit ? '0' : '1'} />
                {p.nilai_terbit ? (
                  <TombolKirim className="btn-secondary" konfirmasi="Tarik nilai? Siswa dan orang tua tidak bisa melihatnya lagi sampai diterbitkan ulang.">Tarik ke Draf</TombolKirim>
                ) : (
                  <TombolKirim className="btn-hijau" konfirmasi="Terbitkan nilai? Siswa dan orang tua akan bisa melihat nilai ini.">Terbitkan Nilai</TombolKirim>
                )}
              </form>
            )}
          </>
        }
      />
      <Kartu>
        {baris.length === 0 ? <Kosong>Belum ada siswa di kelas ini.</Kosong> : (
          <form action={simpanNilai}>
            <input type="hidden" name="pengampu_id" value={p.id} />
            <input type="hidden" name="jumlah_uh" value={jumlahUH} />
            <TabelWadah>
              <table className="tabel">
                <thead>
                  <tr>
                    <th>Siswa</th>
                    <th title="Rata-rata nilai tugas, terisi otomatis">Tugas</th>
                    {Array.from({ length: jumlahUH }, (_, i) => <th key={i}>UH {i + 1}</th>)}
                    <th>PTS</th>
                    <th>PAS</th>
                    <th>Akhir</th>
                  </tr>
                </thead>
                <tbody>
                  {baris.map((b) => (
                    <tr key={b.siswa_id}>
                      <td className="whitespace-nowrap font-medium">{b.nama}</td>
                      <td className="bg-slate-50 text-slate-600">{nilaiTampil(b.tugas)}</td>
                      {Array.from({ length: jumlahUH }, (_, i) => (
                        <td key={i}>
                          {pemilik ? <input name={`uh${i + 1}_${b.siswa_id}`} type="number" min={0} max={100} step="0.5" defaultValue={b.uh[i] ?? ''} className="input w-20" /> : nilaiTampil(b.uh[i])}
                        </td>
                      ))}
                      <td>{pemilik ? <input name={`pts_${b.siswa_id}`} type="number" min={0} max={100} step="0.5" defaultValue={b.pts ?? ''} className="input w-20" /> : nilaiTampil(b.pts)}</td>
                      <td>{pemilik ? <input name={`pas_${b.siswa_id}`} type="number" min={0} max={100} step="0.5" defaultValue={b.pas ?? ''} className="input w-20" /> : nilaiTampil(b.pas)}</td>
                      <td className="whitespace-nowrap font-semibold">{nilaiTampil(b.akhir)}{!b.lengkap && b.akhir != null && <span className="ml-1 text-[11px] font-normal text-slate-400">sementara</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabelWadah>
            {pemilik && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {jumlahUH < 10 && <Link href={`/nilai/${p.id}?uh=${jumlahUH + 1}`} className="btn-secondary btn-sm">+ Kolom UH</Link>}
                  <span className="self-center">Kolom Tugas terisi otomatis dari penilaian tugas. Kosongkan sel untuk menghapus nilai.</span>
                </div>
                <TombolKirim>Simpan Nilai</TombolKirim>
              </div>
            )}
          </form>
        )}
      </Kartu>
    </>
  );
}
