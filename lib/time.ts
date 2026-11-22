export const TZ = 'Asia/Jakarta';
export const NAMA_HARI = ['', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** Tanggal hari ini di WIB, format YYYY-MM-DD */
export function todayWIB(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

/** 1 = Senin ... 7 = Minggu */
export function hariDari(tanggal: string): number {
  const d = new Date(tanggal + 'T00:00:00Z').getUTCDay();
  return d === 0 ? 7 : d;
}

export function tambahHari(tanggal: string, n: number): string {
  const d = new Date(tanggal + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function fmtTanggal(tanggal: string, denganHari = true): string {
  const [y, m, d] = tanggal.split('-').map(Number);
  const s = `${d} ${BULAN[m - 1]} ${y}`;
  return denganHari ? `${NAMA_HARI[hariDari(tanggal)]}, ${s}` : s;
}

function bagian(date: Date) {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date);
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? '';
  return { y: v('year'), m: v('month'), d: v('day'), h: v('hour') === '24' ? '00' : v('hour'), mi: v('minute') };
}

/** contoh: 21 Nov 2026 07.30 */
export function fmtWaktu(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const b = bagian(new Date(date));
  return `${Number(b.d)} ${BULAN[Number(b.m) - 1]} ${b.y} ${b.h}.${b.mi}`;
}

/** Tanggal (YYYY-MM-DD) dari timestamp, dalam WIB */
export function tanggalWIB(date: Date | string): string {
  const b = bagian(new Date(date));
  return `${b.y}-${b.m}-${b.d}`;
}

/** Nilai untuk <input type="datetime-local"> dalam WIB */
export function keInputWaktu(date: Date | string): string {
  const b = bagian(new Date(date));
  return `${b.y}-${b.m}-${b.d}T${b.h}:${b.mi}`;
}

/** Dari isian datetime-local (dianggap WIB) ke Date */
export function dariInputWaktu(v: string): Date {
  return new Date(`${v}:00+07:00`);
}

export function jam(t: string): string {
  return t.slice(0, 5).replace(':', '.');
}

/** contoh: 22 Nov 03.47 (tanpa tahun, untuk daftar) */
export function fmtSingkat(date: Date | string): string {
  const b = bagian(new Date(date));
  return `${Number(b.d)} ${BULAN[Number(b.m) - 1]} ${b.h}.${b.mi}`;
}
