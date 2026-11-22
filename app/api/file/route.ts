import { NextResponse, type NextRequest } from 'next/server';
import { getUser } from '@/lib/auth';
import { bacaFileLokal, pakaiSupabase, urlTandaTangan } from '@/lib/storage';

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf',
};

/** Membuka file unggahan. Hanya untuk pengguna yang sudah login (kecuali logo sekolah). */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams.get('p') ?? '';
  if (!p || p.includes('..')) return new NextResponse('Tidak ditemukan', { status: 404 });
  if (!p.startsWith('logo/') && !(await getUser())) return new NextResponse('Belum login', { status: 401 });

  if (pakaiSupabase()) {
    const url = await urlTandaTangan(p);
    return url ? NextResponse.redirect(url) : new NextResponse('Tidak ditemukan', { status: 404 });
  }
  const isi = await bacaFileLokal(p);
  if (!isi) return new NextResponse('Tidak ditemukan', { status: 404 });
  const ext = p.split('.').pop()?.toLowerCase() ?? '';
  return new NextResponse(new Uint8Array(isi), { headers: { 'Content-Type': MIME[ext] ?? 'application/octet-stream' } });
}
