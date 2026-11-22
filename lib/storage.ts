import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

export const MAKS_FILE = 2 * 1024 * 1024; // 2 MB (KF-19, KF-20)
const FOLDER = ['tugas', 'pengumpulan', 'pengumuman', 'profil', 'logo'];
const DIR_LOKAL = path.join(process.cwd(), '.uploads');

const bucket = () => process.env.SUPABASE_BUCKET || 'classconnect';
let klien: SupabaseClient | null = null;

export function pakaiSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supa() {
  if (!klien) {
    klien = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    });
  }
  return klien;
}

function namaAman(nama: string) {
  return nama.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80) || 'file';
}

/** Simpan file unggahan. Mengembalikan null jika tidak ada file. */
export async function simpanFile(file: FormDataEntryValue | null, folder: string) {
  if (!file || typeof file === 'string' || file.size === 0) return null;
  if (file.size > MAKS_FILE) throw new Error('Ukuran file maksimal 2 MB. Kirim file yang lebih besar sebagai tautan.');
  const nama = namaAman(file.name);
  const lokasi = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${nama}`;
  const isi = Buffer.from(await file.arrayBuffer());

  if (pakaiSupabase()) {
    const { error } = await supa().storage.from(bucket()).upload(lokasi, isi, {
      contentType: file.type || 'application/octet-stream',
    });
    if (error) throw new Error('Gagal mengunggah file: ' + error.message);
  } else {
    const tujuan = path.join(DIR_LOKAL, lokasi);
    await fs.mkdir(path.dirname(tujuan), { recursive: true });
    await fs.writeFile(tujuan, isi);
  }
  return { path: lokasi, nama: file.name };
}

/** Alamat sementara untuk membuka file (dipanggil oleh /api/file). */
export async function urlTandaTangan(lokasi: string): Promise<string | null> {
  const { data } = await supa().storage.from(bucket()).createSignedUrl(lokasi, 60 * 10);
  return data?.signedUrl ?? null;
}

export async function bacaFileLokal(lokasi: string) {
  const tujuan = path.resolve(DIR_LOKAL, lokasi);
  if (!tujuan.startsWith(DIR_LOKAL)) return null;
  try {
    return await fs.readFile(tujuan);
  } catch {
    return null;
  }
}

/** Hapus semua file unggahan (dipakai Reset Data Demo, KF-33). */
export async function hapusSemuaFile() {
  if (pakaiSupabase()) {
    for (const folder of FOLDER) {
      for (;;) {
        const { data } = await supa().storage.from(bucket()).list(folder, { limit: 1000 });
        if (!data || data.length === 0) break;
        await supa().storage.from(bucket()).remove(data.map((f) => `${folder}/${f.name}`));
        if (data.length < 1000) break;
      }
    }
  } else {
    await fs.rm(DIR_LOKAL, { recursive: true, force: true });
  }
}

export function linkFile(lokasi: string | null | undefined) {
  return lokasi ? `/api/file?p=${encodeURIComponent(lokasi)}` : null;
}
