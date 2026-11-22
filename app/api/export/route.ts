import { NextResponse, type NextRequest } from 'next/server';
import { getUser } from '@/lib/auth';
import { csv, dataAbsensi, kelasRekap, matriksNilai } from '@/lib/rekap';
import { todayWIB } from '@/lib/time';

/** KF-18: unduh rekap sebagai CSV (dibuka langsung di Excel). */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return new NextResponse('Belum login', { status: 401 });
  const sp = req.nextUrl.searchParams;
  const kelas = (await kelasRekap(user)).find((k) => k.id === Number(sp.get('kelas')));
  if (!kelas) return new NextResponse('Tidak diizinkan', { status: 403 });

  let isi: string;
  let nama: string;
  if (sp.get('jenis') === 'nilai') {
    const { mapel, baris } = await matriksNilai(kelas.id);
    isi = csv([['Nama siswa', ...mapel.map((m) => m.mapel_nama), 'Rata-rata'], ...baris.map((b) => [b.nama, ...b.nilai, b.rata])]);
    nama = `nilai-${kelas.nama}-${todayWIB()}.csv`;
  } else {
    const dari = sp.get('dari') ?? todayWIB();
    const sampai = sp.get('sampai') ?? todayWIB();
    const rows = await dataAbsensi(kelas.id, dari, sampai);
    isi = csv([['Nama siswa', 'Hadir', 'Sakit', 'Izin', 'Alpa', 'Total pertemuan', 'Kehadiran (%)'], ...rows.map((r) => [r.nama, r.h, r.s, r.i, r.a, r.total, r.persen])]);
    nama = `absensi-${kelas.nama}-${dari}-sd-${sampai}.csv`;
  }
  return new NextResponse(isi, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${nama.replace(/\s+/g, '_')}"` },
  });
}
