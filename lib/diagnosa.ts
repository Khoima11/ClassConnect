import 'server-only';
import { bacaDatabaseUrl, sql } from './db';

export type Diagnosa = {
  judul: string;
  penyebab: string;
  solusi: string[];
  detail?: string;
  koneksi?: string;
  catatan: string[];
};

const LANGKAH_REDEPLOY = 'Setelah mengubah Environment Variables, buka Vercel → Deployments → ⋯ pada deployment teratas → Redeploy.';

/** Memeriksa koneksi database dan menjelaskan penyebab kegagalan dalam bahasa sederhana. */
export async function periksaDatabase(): Promise<Diagnosa | null> {
  const mentah = process.env.DATABASE_URL;
  if (!mentah) {
    return {
      judul: 'DATABASE_URL belum diisi',
      penyebab: 'Aplikasi tidak menemukan variabel DATABASE_URL di Vercel.',
      solusi: [
        'Buka Vercel → project ClassConnect → Settings → Environment Variables.',
        'Tambahkan DATABASE_URL berisi alamat "Transaction pooler" dari Supabase (port 6543), centang Production dan Preview.',
        LANGKAH_REDEPLOY,
      ],
      catatan: [],
    };
  }
  const info = bacaDatabaseUrl(mentah);
  if (!info) {
    return {
      judul: 'Format DATABASE_URL tidak dikenali',
      penyebab: 'Isinya harus diawali postgresql:// dan berbentuk postgresql://USER:PASSWORD@HOST:PORT/postgres',
      solusi: ['Salin ulang dari Supabase → tombol Connect → Connection String → Transaction pooler.', 'Ganti [YOUR-PASSWORD] dengan password database.', LANGKAH_REDEPLOY],
      catatan: [],
    };
  }
  const koneksi = `${info.user} @ ${info.host}:${info.port}`;
  const catatan = [...info.catatan];
  if (/^db\.[a-z0-9]+\.supabase\.co$/.test(info.host)) {
    catatan.push('Alamat yang dipakai adalah "Direct connection". Di Vercel sebaiknya memakai "Transaction pooler" (host ...pooler.supabase.com, port 6543).');
  }

  try {
    await sql`select 1 from sekolah limit 1`;
    return null;
  } catch (e) {
    const err = e as { code?: string; message?: string };
    const kode = err.code ?? '';
    const pesan = err.message ?? String(e);
    const dasar = { detail: `${kode ? kode + ': ' : ''}${pesan}`, koneksi, catatan };

    if (kode === '42P01') {
      return {
        ...dasar,
        judul: 'Koneksi berhasil, tetapi tabel belum ada',
        penyebab: 'Database sudah tersambung, tetapi tabel ClassConnect belum dibuat di project Supabase ini.',
        solusi: [
          'Pilihan 1: buka halaman /setup di aplikasi ini lalu klik "Siapkan Database Sekarang".',
          'Pilihan 2: jalankan db/01_ddl.sql lalu db/02_dml_data_demo.sql di Supabase → SQL Editor.',
          'Pastikan DATABASE_URL menunjuk ke project Supabase yang sama dengan tempat kamu menjalankan SQL.',
        ],
      };
    }
    if (kode === '28P01' || /password authentication failed/i.test(pesan)) {
      return {
        ...dasar,
        judul: 'Password database salah',
        penyebab: 'Supabase menolak password yang ada di DATABASE_URL.',
        solusi: [
          'Di Supabase: Project Settings → Database → Reset database password. Buat password baru berisi huruf dan angka saja.',
          'Salin ulang alamat Transaction pooler, ganti [YOUR-PASSWORD] (termasuk tanda kurung sikunya) dengan password baru.',
          'Perbarui DATABASE_URL di Vercel. ' + LANGKAH_REDEPLOY,
        ],
      };
    }
    if (/tenant or user not found/i.test(pesan)) {
      return {
        ...dasar,
        judul: 'Username atau alamat pooler tidak cocok',
        penyebab: 'Pada Transaction pooler, username harus berbentuk postgres.KODEPROJECT dan host harus sesuai region project.',
        solusi: [
          'Salin ulang alamat lengkap dari Supabase → Connect → Connection String → Transaction pooler (jangan diketik manual).',
          'Pastikan bagian sebelum tanda ":" adalah postgres.xxxxxxxx, bukan hanya postgres.',
          'Perbarui DATABASE_URL di Vercel. ' + LANGKAH_REDEPLOY,
        ],
      };
    }
    if (['ENOTFOUND', 'EAI_AGAIN'].includes(kode) || /getaddrinfo/i.test(pesan)) {
      return {
        ...dasar,
        judul: 'Alamat server database tidak ditemukan',
        penyebab: 'Nama host di DATABASE_URL tidak bisa ditemukan. Biasanya karena memakai "Direct connection" (db.xxx.supabase.co) yang tidak bisa diakses dari Vercel, atau ada salah ketik.',
        solusi: [
          'Pakai alamat "Transaction pooler" (host ...pooler.supabase.com, port 6543), bukan Direct connection.',
          'Perbarui DATABASE_URL di Vercel. ' + LANGKAH_REDEPLOY,
        ],
      };
    }
    if (['ETIMEDOUT', 'ECONNREFUSED', 'CONNECT_TIMEOUT', 'ECONNRESET', 'ENETUNREACH'].includes(kode) || /timeout/i.test(pesan)) {
      return {
        ...dasar,
        judul: 'Server database tidak merespons',
        penyebab: 'Koneksi ke Supabase terputus atau terlalu lama. Penyebab paling umum: project Supabase sedang dijeda (paused), atau memakai Direct connection / port yang salah.',
        solusi: [
          'Buka dashboard Supabase. Jika project berstatus Paused, klik "Restore project" dan tunggu beberapa menit.',
          'Pastikan DATABASE_URL memakai Transaction pooler dengan port 6543.',
          LANGKAH_REDEPLOY,
        ],
      };
    }
    return {
      ...dasar,
      judul: 'Gagal terhubung ke database',
      penyebab: 'Terjadi kesalahan yang tidak dikenali. Lihat detail di bawah.',
      solusi: ['Periksa ulang DATABASE_URL (Transaction pooler, port 6543, password benar).', LANGKAH_REDEPLOY, 'Kirim detail error di bawah ke pengembang jika masih gagal.'],
    };
  }
}
