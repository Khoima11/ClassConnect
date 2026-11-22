export type Bobot = { tugas: number; uh: number; pts: number; pas: number };
export const BOBOT_BAWAAN: Bobot = { tugas: 20, uh: 30, pts: 20, pas: 30 };

export type Komponen = { tugas: number | null; uh: number | null; pts: number | null; pas: number | null };

/**
 * Nilai akhir = rata-rata berbobot (KF-25).
 * Komponen yang belum ada diabaikan dan bobotnya dibagi ulang; hasilnya ditandai "sementara".
 */
export function nilaiAkhir(k: Komponen, b: Bobot): { akhir: number | null; lengkap: boolean } {
  const bagian: [number | null, number][] = [
    [k.tugas, b.tugas],
    [k.uh, b.uh],
    [k.pts, b.pts],
    [k.pas, b.pas],
  ];
  let total = 0;
  let bobot = 0;
  for (const [n, w] of bagian) {
    if (n != null && w > 0) {
      total += n * w;
      bobot += w;
    }
  }
  if (bobot === 0) return { akhir: null, lengkap: false };
  const lengkap = bagian.every(([n, w]) => w === 0 || n != null);
  return { akhir: Math.round((total / bobot) * 10) / 10, lengkap };
}

export function rata(xs: (number | null | undefined)[]): number | null {
  const v = xs.filter((x): x is number => typeof x === 'number');
  if (v.length === 0) return null;
  return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10;
}

export function predikat(n: number | null) {
  if (n == null) return '-';
  if (n >= 90) return 'A';
  if (n >= 80) return 'B';
  if (n >= 70) return 'C';
  return 'D';
}
