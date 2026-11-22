import Link from 'next/link';
import { redirect } from 'next/navigation';
import { InputFile, TombolKirim } from '@/components/client';
import { Bidang, Judul, Kartu, Kosong, Lencana, TabelWadah } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { cekPengampu, daftarSiswaKelas, siswaMilik } from '@/lib/data';
import { sql } from '@/lib/db';
import { linkFile } from '@/lib/storage';
import { fmtWaktu, keInputWaktu } from '@/lib/time';
import { hapusTugas, kumpulkanTugas, nilaiTugas, ubahTugas } from '../actions';

export const dynamic = 'force-dynamic';

function Lampiran({ path, nama, tautan }: { path?: string | null; nama?: string | null; tautan?: string | null }) {
  if (!path && !tautan) return null;
  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {path && <a href={linkFile(path)!} target="_blank" className="btn-secondary btn-sm">📎 {nama ?? 'Lampiran'}</a>}
      {tautan && <a href={tautan} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">🔗 Buka tautan</a>}
    </div>
  );
}

export default async function DetailTugas({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [t] = await sql`select * from tugas where id = ${Number(id)}`;
  if (!t) redirect('/tugas');
  const p = await cekPengampu(user, t.pengampu_id, 'baca');
  const lewat = new Date(t.tenggat) < new Date();
  const pemilik = user.peran === 'guru' && p.guru_id === user.id;

  const kepala = (
    <Kartu className="mb-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <Lencana warna="biru">{p.mapel_nama}</Lencana>
        <Lencana>Kelas {p.kelas_nama}</Lencana>
        <Lencana warna={lewat ? 'merah' : 'kuning'}>Tenggat {fmtWaktu(t.tenggat)}</Lencana>
        <Lencana>{t.boleh_terlambat ? 'Boleh terlambat' : 'Tidak menerima keterlambatan'}</Lencana>
      </div>
      {t.deskripsi && <p className="mt-3 whitespace-pre-line text-sm">{t.deskripsi}</p>}
      <div className="mt-3"><Lampiran path={t.lampiran_path} nama={t.lampiran_nama} tautan={t.tautan} /></div>
      <p className="mt-3 text-xs text-slate-400">Oleh {p.guru_nama} · dibuat {fmtWaktu(t.dibuat)}</p>
    </Kartu>
  );

  // Siswa: kumpulkan tugas
  if (user.peran === 'siswa' || user.peran === 'ortu') {
    const siswaId = siswaMilik(user)!;
    const [pg] = await sql`select * from pengumpulan where tugas_id = ${t.id} and siswa_id = ${siswaId}`;
    const bolehKirim = user.peran === 'siswa' && pg?.nilai == null && (lewat ? t.boleh_terlambat && !pg : true);
    return (
      <>
        <Judul judul={t.judul} aksi={<Link href="/tugas" className="btn-secondary">Kembali</Link>} />
        {kepala}
        <Kartu judul={user.peran === 'ortu' ? `Pengumpulan ${user.anakAktif?.nama}` : 'Pengumpulan saya'}>
          {pg ? (
            <div className="space-y-2 text-sm">
              <p>
                Dikirim {fmtWaktu(pg.dikirim_pada)}{' '}
                {pg.terlambat ? <Lencana warna="kuning">Terlambat</Lencana> : <Lencana warna="hijau">Tepat waktu</Lencana>}
              </p>
              {pg.jawaban && <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3">{pg.jawaban}</p>}
              <Lampiran path={pg.file_path} nama={pg.file_nama} tautan={pg.tautan} />
              {pg.nilai != null && p.nilai_terbit ? (
                <div className="rounded-lg bg-hijau-50 p-3">
                  <p className="font-semibold text-hijau-700">Nilai: {pg.nilai}</p>
                  {pg.komentar && <p className="mt-1 text-slate-700">Komentar guru: {pg.komentar}</p>}
                </div>
              ) : pg.nilai != null ? (
                <p className="text-slate-500">Sudah dinilai. Nilai akan tampil setelah guru menerbitkan nilai mapel ini.</p>
              ) : (
                <p className="text-slate-500">Menunggu penilaian guru.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{lewat && !t.boleh_terlambat ? 'Tidak dikumpulkan. Tenggat sudah lewat.' : 'Belum dikumpulkan.'}</p>
          )}
          {bolehKirim && (
            <form action={kumpulkanTugas} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              <input type="hidden" name="id" value={t.id} />
              {lewat && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Tenggat sudah lewat. Tugas tetap bisa dikirim, tetapi tercatat terlambat dan hanya bisa dikirim sekali.</p>}
              <Bidang label={pg ? 'Kirim ulang jawaban' : 'Jawaban'}><textarea name="jawaban" rows={4} defaultValue={pg?.jawaban ?? ''} className="input" /></Bidang>
              <Bidang label="File / foto jawaban (opsional)"><InputFile name="file" /></Bidang>
              <Bidang label="Tautan (opsional)" ket="Untuk file lebih dari 2 MB, unggah ke Google Drive lalu tempel tautannya di sini">
                <input name="tautan" type="url" defaultValue={pg?.tautan ?? ''} placeholder="https://" className="input" />
              </Bidang>
              <TombolKirim className="btn-hijau">{pg ? 'Kirim Ulang' : 'Kumpulkan Tugas'}</TombolKirim>
            </form>
          )}
        </Kartu>
      </>
    );
  }

  // Guru, wali kelas, kepala, admin: status per siswa
  const siswa = await daftarSiswaKelas(p.kelas_id);
  const kumpul = await sql`select * from pengumpulan where tugas_id = ${t.id}`;
  const terkumpul = kumpul.length;

  return (
    <>
      <Judul judul={t.judul} sub={`${terkumpul} dari ${siswa.length} siswa sudah mengumpulkan`} aksi={<Link href="/tugas" className="btn-secondary">Kembali</Link>} />
      {kepala}
      {pemilik && (
        <Kartu className="mb-4" judul="Pengaturan tugas">
          <div className="flex flex-wrap items-end gap-3">
            <form action={ubahTugas} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={t.id} />
              <Bidang label="Tenggat (WIB)"><input type="datetime-local" name="tenggat" defaultValue={keInputWaktu(t.tenggat)} className="input" /></Bidang>
              <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="boleh_terlambat" defaultChecked={t.boleh_terlambat} /> Boleh terlambat</label>
              <TombolKirim className="btn-secondary">Simpan</TombolKirim>
            </form>
            <form action={hapusTugas} className="ml-auto">
              <input type="hidden" name="id" value={t.id} />
              <TombolKirim className="btn-danger" konfirmasi="Hapus tugas ini beserta semua pengumpulannya?">Hapus Tugas</TombolKirim>
            </form>
          </div>
        </Kartu>
      )}
      <Kartu judul="Pengumpulan siswa">
        {siswa.length === 0 ? <Kosong>Belum ada siswa di kelas ini.</Kosong> : (
          <form action={nilaiTugas}>
            <input type="hidden" name="id" value={t.id} />
            <TabelWadah>
              <table className="tabel">
                <thead><tr><th>Siswa</th><th>Status</th><th>Jawaban</th><th className="w-24">Nilai</th><th>Komentar</th></tr></thead>
                <tbody>
                  {siswa.map((s) => {
                    const pg = kumpul.find((k) => k.siswa_id === s.id);
                    return (
                      <tr key={s.id}>
                        <td className="font-medium">{s.nama}</td>
                        <td className="whitespace-nowrap">
                          {!pg ? <Lencana warna={lewat ? 'merah' : 'abu'}>Belum</Lencana> : pg.terlambat ? <Lencana warna="kuning">Terlambat</Lencana> : <Lencana warna="hijau">Tepat waktu</Lencana>}
                          {pg && <p className="mt-1 text-[11px] text-slate-400">{fmtWaktu(pg.dikirim_pada)}</p>}
                        </td>
                        <td className="max-w-xs">
                          {pg?.jawaban && <p className="line-clamp-3 whitespace-pre-line text-xs">{pg.jawaban}</p>}
                          {pg && <div className="mt-1"><Lampiran path={pg.file_path} nama={pg.file_nama} tautan={pg.tautan} /></div>}
                        </td>
                        <td>
                          {pg ? (pemilik ? <input name={`nilai_${pg.id}`} type="number" min={0} max={100} step="0.5" defaultValue={pg.nilai ?? ''} className="input w-20" /> : (pg.nilai ?? '-')) : '-'}
                        </td>
                        <td>
                          {pg ? (pemilik ? <input name={`komentar_${pg.id}`} defaultValue={pg.komentar ?? ''} className="input min-w-40" /> : (pg.komentar ?? '-')) : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TabelWadah>
            {pemilik && terkumpul > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">Nilai tugas otomatis masuk ke komponen <b>Tugas</b> di menu Nilai.</p>
                <TombolKirim>Simpan Penilaian</TombolKirim>
              </div>
            )}
          </form>
        )}
      </Kartu>
    </>
  );
}
