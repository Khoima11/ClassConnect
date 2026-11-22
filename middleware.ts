import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_SESI, bacaToken, buatToken, opsiCookie } from './lib/session';

const TERBUKA = ['/login'];
const PUBLIK = ['/setup'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sesi = await bacaToken(req.cookies.get(COOKIE_SESI)?.value);

  if (TERBUKA.some((p) => pathname.startsWith(p))) {
    if (sesi) return NextResponse.redirect(new URL('/dashboard', req.url));
    return NextResponse.next();
  }

  if (PUBLIK.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname === '/api/file' && req.nextUrl.searchParams.get('p')?.startsWith('logo/')) return NextResponse.next();

  if (!sesi) {
    if (pathname.startsWith('/api/')) return new NextResponse('Belum login', { status: 401 });
    const url = new URL('/login', req.url);
    if (pathname !== '/' && pathname !== '/dashboard') url.searchParams.set('lanjut', pathname);
    const res = NextResponse.redirect(url);
    res.cookies.delete(COOKIE_SESI);
    return res;
  }

  // Halaman admin hanya untuk peran admin (diperiksa lagi di setiap halaman/aksi).
  if (pathname.startsWith('/admin') && sesi.peran !== 'admin') {
    return NextResponse.redirect(new URL('/tidak-diizinkan', req.url));
  }

  // Perpanjang sesi selama pengguna aktif.
  const res = pathname === '/' ? NextResponse.redirect(new URL('/dashboard', req.url)) : NextResponse.next();
  res.cookies.set(COOKIE_SESI, await buatToken(sesi), opsiCookie);
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|svg|ico)$).*)'],
};
