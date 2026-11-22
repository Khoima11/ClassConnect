import 'server-only';
import { bobotAktif, nilaiPengampu, pengampuKelas, rekapAbsensi, persen, semuaKelas, type BarisNilai, type PengampuInfo } from './data';
import type { CurrentUser } from './types';

export async function kelasRekap(user: CurrentUser) {
  const semua = await semuaKelas();
  if (user.peran === 'admin' || user.peran === 'kepala') return semua;
  if (user.peran === 'guru') return semua.filter((k) => user.waliKelas.some((w) => w.id === k.id));
  return [];
}

export async function matriksNilai(kelasId: number) {
  const bobot = await bobotAktif();
  const mapel = await pengampuKelas(kelasId);
  const kolom: { p: PengampuInfo; baris: BarisNilai[]; jumlahUH: number }[] = [];
  for (const p of mapel) kolom.push({ p, ...(await nilaiPengampu(p, bobot)) });
  const siswa = kolom[0]?.baris.map((b) => ({ id: b.siswa_id, nama: b.nama })) ?? [];
  const baris = siswa.map((s) => {
    const nilai = kolom.map((k) => k.baris.find((b) => b.siswa_id === s.id)?.akhir ?? null);
    const ada = nilai.filter((n): n is number => n != null);
    return { ...s, nilai, rata: ada.length ? Math.round((ada.reduce((a, b) => a + b, 0) / ada.length) * 10) / 10 : null };
  });
  return { mapel, baris };
}

export async function dataAbsensi(kelasId: number, dari: string, sampai: string) {
  const rows = await rekapAbsensi(kelasId, dari, sampai);
  return rows.map((r) => ({ ...r, persen: persen(r.h, r.total) }));
}

export function csv(rows: (string | number | null)[][]) {
  return '﻿' + rows.map((r) => r.map((c) => {
    const s = c == null ? '' : String(c);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(';')).join('\n');
}
