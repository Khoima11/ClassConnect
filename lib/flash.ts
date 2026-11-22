import { redirect } from 'next/navigation';

/** Kembali ke halaman dengan pesan berhasil atau gagal. */
export function kembali(tujuan: string, pesan: { ok?: string; err?: string }): never {
  const url = new URL(tujuan, 'http://x');
  url.searchParams.delete('ok');
  url.searchParams.delete('err');
  if (pesan.ok) url.searchParams.set('ok', pesan.ok);
  if (pesan.err) url.searchParams.set('err', pesan.err);
  redirect(url.pathname + url.search);
}

export function teks(fd: FormData, nama: string): string {
  return String(fd.get(nama) ?? '').trim();
}

export function angka(fd: FormData, nama: string): number | null {
  const v = String(fd.get(nama) ?? '').trim().replace(',', '.');
  if (v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
