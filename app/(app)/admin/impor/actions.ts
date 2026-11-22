'use server';

import bcrypt from 'bcryptjs';
import { requireUser } from '@/lib/auth';
import { sekolah, semuaKelas } from '@/lib/data';
import { sql } from '@/lib/db';
import { kembali } from '@/lib/flash';
import { SANDI_DEMO } from '@/lib/seed';

function baca(teks: string): Record<string, string>[] {
  const baris = teks.replace(/^﻿/, '').split(/\r?\n/).filter((b) => b.trim() !== '');
  if (baris.length < 2) return [];
  const pemisah = (baris[0].match(/;/g)?.length ?? 0) >= (baris[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const pecah = (b: string) => {
    const hasil: string[] = [];
    let cur = '';
    let kutip = false;
    for (let i = 0; i < b.length; i++) {
      const c = b[i];
      if (c === '"') {
        if (kutip && b[i + 1] === '"') { cur += '"'; i++; } else kutip = !kutip;
      } else if (c === pemisah && !kutip) { hasil.push(cur.trim()); cur = ''; } else cur += c;
    }
    hasil.push(cur.trim());
    return hasil;
  };
  const kepala = pecah(baris[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  return baris.slice(1).map((b) => {
    const v = pecah(b);
    return Object.fromEntries(kepala.map((h, i) => [h, v[i] ?? '']));
  });
}

/** KF-10: impor siswa/guru dari CSV (Simpan Sebagai CSV dari Excel). */
export async function imporData(fd: FormData) {
  await requireUser(['admin']);
  const jenis = String(fd.get('jenis'));
  const file = fd.get('file');
  if (!file || typeof file === 'string' || file.size === 0) kembali('/admin/impor', { err: 'Pilih file CSV.' });
  if (file.size > 2 * 1024 * 1024) kembali('/admin/impor', { err: 'File maksimal 2 MB.' });
  const rows = baca(await file.text());
  if (rows.length === 0) kembali('/admin/impor', { err: 'File kosong atau baris judul kolom tidak ditemukan.' });
  if (rows.length > 600) kembali('/admin/impor', { err: 'Maksimal 600 baris per impor. Pecah file menjadi beberapa bagian.' });

  const demo = (await sekolah()).mode_demo;
  const hashDemo = await bcrypt.hash(SANDI_DEMO, 10);
  const hash = async (s: string) => (demo ? hashDemo : bcrypt.hash(s, 8));
  let masuk = 0;
  const lewati: string[] = [];

  if (jenis === 'siswa') {
    const kelas = await semuaKelas();
    for (const [i, r] of rows.entries()) {
      const no = i + 2;
      const nisn = (r.nisn ?? '').replace(/\D/g, '');
      if (!r.nama || nisn.length < 6) { lewati.push(`baris ${no} (nama/NISN kosong)`); continue; }
      const k = kelas.find((x) => x.nama.toLowerCase() === (r.kelas ?? '').toLowerCase());
      try {
        await sql.begin(async (tx) => {
          const [u] = await tx`insert into users (username, password_hash, nama, peran) values (${nisn}, ${await hash(nisn)}, ${r.nama}, 'siswa') returning id`;
          await tx`insert into siswa (user_id, nisn, jenis_kelamin, kelas_id)
            values (${u.id}, ${nisn}, ${(r.jenis_kelamin ?? '').toUpperCase().startsWith('P') ? 'P' : 'L'}, ${k?.id ?? null})`;
          if (r.nama_ortu) {
            const [o] = await tx`insert into users (username, password_hash, nama, peran, no_hp)
              values (${'ortu' + nisn}, ${await hash(nisn)}, ${r.nama_ortu}, 'ortu', ${r.no_hp_ortu || null}) returning id`;
            await tx`insert into ortu_siswa (ortu_id, siswa_id, hubungan) values (${o.id}, ${u.id}, ${r.hubungan || 'Wali'})`;
          }
        });
        masuk++;
      } catch {
        lewati.push(`baris ${no} (NISN ${nisn} sudah ada)`);
      }
    }
  } else {
    for (const [i, r] of rows.entries()) {
      const no = i + 2;
      const username = (r.username || r.nip || '').trim();
      if (!r.nama || !username) { lewati.push(`baris ${no} (nama/username kosong)`); continue; }
      try {
        await sql.begin(async (tx) => {
          const [u] = await tx`insert into users (username, password_hash, nama, peran, no_hp)
            values (${username}, ${await hash(r.nip || username)}, ${r.nama}, 'guru', ${r.no_hp || null}) returning id`;
          await tx`insert into guru (user_id, nip) values (${u.id}, ${r.nip || null})`;
        });
        masuk++;
      } catch {
        lewati.push(`baris ${no} (username ${username} sudah ada)`);
      }
    }
  }
  const info = `${masuk} data berhasil diimpor.` + (lewati.length ? ` Dilewati: ${lewati.slice(0, 8).join(', ')}${lewati.length > 8 ? ', ...' : ''}` : '');
  kembali('/admin/impor', masuk > 0 ? { ok: info } : { err: info });
}
