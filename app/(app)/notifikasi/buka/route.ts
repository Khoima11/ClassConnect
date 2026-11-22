import { NextResponse, type NextRequest } from 'next/server';
import { getUser } from '@/lib/auth';
import { sql } from '@/lib/db';

/** Menandai notifikasi dibaca lalu membuka tautannya. */
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));
  const id = Number(req.nextUrl.searchParams.get('id'));
  const [n] = await sql`update notifikasi set dibaca = true where id = ${id} and user_id = ${user.id} returning tautan`;
  const tujuan = n?.tautan && String(n.tautan).startsWith('/') ? n.tautan : '/notifikasi';
  return NextResponse.redirect(new URL(tujuan, req.url));
}
