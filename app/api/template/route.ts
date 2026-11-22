import { NextResponse, type NextRequest } from 'next/server';

const TEMPLATE: Record<string, string> = {
  siswa: 'nama;nisn;jenis_kelamin;kelas;nama_ortu;hubungan;no_hp_ortu\nContoh Siswa Satu;0101010101;L;VII A;Contoh Ayah;Ayah;081234567890\n',
  guru: 'nama;nip;username;no_hp\nContoh Guru, S.Pd.;199001012020011001;guru.contoh;081234567891\n',
};

export async function GET(req: NextRequest) {
  const jenis = req.nextUrl.searchParams.get('jenis') === 'guru' ? 'guru' : 'siswa';
  return new NextResponse('﻿' + TEMPLATE[jenis], {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="template-${jenis}.csv"` },
  });
}
