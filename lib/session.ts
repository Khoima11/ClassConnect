// Dipakai oleh middleware (edge) dan server: jangan impor modul Node di sini.
import { SignJWT, jwtVerify } from 'jose';
import type { Peran } from './types';

export const COOKIE_SESI = 'cc_sesi';
export const MENIT_SESI = 60; // sesi berakhir setelah 60 menit tidak aktif (KF-05)

export type IsiSesi = { uid: number; peran: Peran };

function kunci() {
  const s = process.env.SESSION_SECRET || 'kunci-pengembangan-classconnect-ganti-saat-deploy';
  return new TextEncoder().encode(s);
}

export async function buatToken(isi: IsiSesi): Promise<string> {
  return new SignJWT({ ...isi })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MENIT_SESI}m`)
    .sign(kunci());
}

export async function bacaToken(token: string | undefined): Promise<IsiSesi | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, kunci());
    return { uid: Number(payload.uid), peran: payload.peran as Peran };
  } catch {
    return null;
  }
}

export const opsiCookie = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: MENIT_SESI * 60,
};
