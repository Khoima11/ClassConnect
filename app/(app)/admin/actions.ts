'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { sekolah, tahunAktif } from '@/lib/data';
import { sql } from '@/lib/db';
import { angka, kembali, teks } from '@/lib/flash';
import { isiDataDemo, SANDI_DEMO } from '@/lib/seed';
import { hapusSemuaFile, simpanFile } from '@/lib/storage';

const admin = () => requireUser(['admin']);

async function sandiBaru() {
  const s = await sekolah();
  if (s.mode_demo) return SANDI_DEMO;
  return Math.random().toString(36).slice(2, 10);
}

function galatUnik(e: unknown, pesan: string) {
  return (e as { code?: string }).code === '23505' ? pesan : (e as Error).message;
}

/* ---------- Pengaturan sekolah (KF-11) ---------- */
export async function simpanSekolah(fd: FormData) {
  await admin();
  const nama = teks(fd, 'nama');
  if (!nama) kembali('/admin/sekolah', { err: 'Nama sekolah wajib diisi.' });
  let logo: { path: string } | null = null;
  try {
    logo = await simpanFile(fd.get('logo'), 'logo');
  } catch (e) {
    kembali('/admin/sekolah', { err: (e as Error).message });
  }
  await sql`update sekolah set nama = ${nama}, nsm = ${teks(fd, 'nsm') || null}, alamat = ${teks(fd, 'alamat') || null},
    kepala_nama = ${teks(fd, 'kepala_nama') || null}, mode_demo = ${fd.get('mode_demo') === 'on'}
    ${logo ? sql`, logo_path = ${logo.path}` : sql``} where id = 1`;
  revalidatePath('/', 'layout');
  kembali('/admin/sekolah', { ok: 'Pengaturan sekolah disimpan.' });
}

/* ---------- Tahun ajaran (KF-06) ---------- */
export async function tambahTahunAjaran(fd: FormData) {
  await admin();
  const nama = teks(fd, 'nama');
  const semester = teks(fd, 'semester');
  if (!/^\d{4}\/\d{4}$/.test(nama) || !['Ganjil', 'Genap'].includes(semester)) kembali('/admin/tahun-ajaran', { err: 'Format tahun ajaran: 2026/2027.' });
  const [t] = await sql`insert into tahun_ajaran (nama, semester) values (${nama}, ${semester}) returning id`;
  await sql`insert into bobot_nilai (tahun_ajaran_id) values (${t.id})`;
  kembali('/admin/tahun-ajaran', { ok: 'Tahun ajaran ditambahkan.' });
}

export async function aktifkanTahunAjaran(fd: FormData) {
  await admin();
  const id = Number(fd.get('id'));
  await sql.begin(async (tx) => {
    await tx`update tahun_ajaran set aktif = false`;
    await tx`update tahun_ajaran set aktif = true where id = ${id}`;
  });
  kembali('/admin/tahun-ajaran', { ok: 'Tahun ajaran aktif diganti.' });
}

/* ---------- Kelas (KF-07) ---------- */
export async function tambahKelas(fd: FormData) {
  await admin();
  const ta = await tahunAktif();
  const nama = teks(fd, 'nama');
  const tingkat = Number(fd.get('tingkat'));
  if (!ta || !nama || ![7, 8, 9].includes(tingkat)) kembali('/admin/kelas', { err: 'Isi nama dan tingkat kelas.' });
  await sql`insert into kelas (nama, tingkat, tahun_ajaran_id, wali_kelas_id) values (${nama}, ${tingkat}, ${ta.id}, ${Number(fd.get('wali')) || null})`;
  kembali('/admin/kelas', { ok: `Kelas ${nama} ditambahkan.` });
}

export async function ubahWali(fd: FormData) {
  await admin();
  await sql`update kelas set wali_kelas_id = ${Number(fd.get('wali')) || null} where id = ${Number(fd.get('id'))}`;
  kembali('/admin/kelas', { ok: 'Wali kelas diperbarui.' });
}

export async function hapusKelas(fd: FormData) {
  await admin();
  const id = Number(fd.get('id'));
  const [{ n }] = await sql`select count(*)::int as n from siswa where kelas_id = ${id}`;
  if (n > 0) kembali('/admin/kelas', { err: 'Pindahkan dulu semua siswa dari kelas ini.' });
  await sql`delete from kelas where id = ${id}`;
  kembali('/admin/kelas', { ok: 'Kelas dihapus.' });
}

/* ---------- Mapel dan pengampu (KF-08) ---------- */
export async function tambahMapel(fd: FormData) {
  await admin();
  const kode = teks(fd, 'kode').toUpperCase();
  const nama = teks(fd, 'nama');
  const kelompok = teks(fd, 'kelompok') === 'PAI' ? 'PAI' : 'Umum';
  if (!kode || !nama) kembali('/admin/mapel', { err: 'Isi kode dan nama mapel.' });
  try {
    await sql`insert into mapel (kode, nama, kelompok) values (${kode}, ${nama}, ${kelompok})`;
  } catch (e) {
    kembali('/admin/mapel', { err: galatUnik(e, 'Kode mapel sudah dipakai.') });
  }
  kembali('/admin/mapel', { ok: 'Mapel ditambahkan.' });
}

export async function hapusMapel(fd: FormData) {
  await admin();
  await sql`delete from mapel where id = ${Number(fd.get('id'))}`;
  kembali('/admin/mapel', { ok: 'Mapel dihapus beserta jadwal, tugas, dan nilainya.' });
}

export async function simpanPengampu(fd: FormData) {
  await admin();
  const kelasId = Number(fd.get('kelas_id'));
  const mapel = await sql`select id from mapel`;
  for (const m of mapel) {
    const guru = Number(fd.get(`guru_${m.id}`)) || null;
    if (guru) {
      await sql`insert into pengampu (guru_id, mapel_id, kelas_id) values (${guru}, ${m.id}, ${kelasId})
        on conflict (mapel_id, kelas_id) do update set guru_id = excluded.guru_id`;
    } else {
      await sql`delete from pengampu where mapel_id = ${m.id} and kelas_id = ${kelasId}`;
    }
  }
  kembali(`/admin/mapel?kelas=${kelasId}`, { ok: 'Pembagian guru pengampu disimpan.' });
}

/* ---------- Pengguna (KF-04, KF-09) ---------- */
async function buatAkun(username: string, nama: string, peran: string, sandi: string, noHp: string | null) {
  const [u] = await sql`insert into users (username, password_hash, nama, peran, no_hp)
    values (${username}, ${await bcrypt.hash(sandi, 10)}, ${nama}, ${peran}, ${noHp}) returning id`;
  return u.id as number;
}

export async function tambahSiswa(fd: FormData) {
  await admin();
  const nama = teks(fd, 'nama');
  const nisn = teks(fd, 'nisn');
  const username = teks(fd, 'username') || nisn;
  const kelasId = Number(fd.get('kelas_id')) || null;
  if (!nama || !/^\d{6,12}$/.test(nisn)) kembali('/admin/siswa', { err: 'Isi nama dan NISN (angka).' });
  const sandi = await sandiBaru();
  try {
    await sql.begin(async (tx) => {
      const [u] = await tx`insert into users (username, password_hash, nama, peran)
        values (${username}, ${await bcrypt.hash(sandi, 10)}, ${nama}, 'siswa') returning id`;
      await tx`insert into siswa (user_id, nisn, jenis_kelamin, kelas_id) values (${u.id}, ${nisn}, ${teks(fd, 'jk') === 'P' ? 'P' : 'L'}, ${kelasId})`;
      const namaOrtu = teks(fd, 'nama_ortu');
      if (namaOrtu) {
        const [o] = await tx`insert into users (username, password_hash, nama, peran, no_hp)
          values (${'ortu' + nisn}, ${await bcrypt.hash(sandi, 10)}, ${namaOrtu}, 'ortu', ${teks(fd, 'hp_ortu') || null}) returning id`;
        await tx`insert into ortu_siswa (ortu_id, siswa_id, hubungan) values (${o.id}, ${u.id}, ${teks(fd, 'hubungan') || 'Wali'})`;
      }
    });
  } catch (e) {
    kembali('/admin/siswa', { err: galatUnik(e, 'Username atau NISN sudah terdaftar.') });
  }
  kembali('/admin/siswa', { ok: `Siswa ${nama} ditambahkan. Kata sandi awal: ${sandi}` });
}

export async function pindahKelas(fd: FormData) {
  await admin();
  await sql`update siswa set kelas_id = ${Number(fd.get('kelas_id')) || null} where user_id = ${Number(fd.get('id'))}`;
  kembali(String(fd.get('kembali') || '/admin/siswa'), { ok: 'Kelas siswa diperbarui.' });
}

export async function tambahGuru(fd: FormData) {
  await admin();
  const nama = teks(fd, 'nama');
  const nip = teks(fd, 'nip');
  const username = teks(fd, 'username');
  if (!nama || !username) kembali('/admin/guru', { err: 'Isi nama dan username.' });
  const sandi = await sandiBaru();
  try {
    const id = await buatAkun(username, nama, 'guru', sandi, teks(fd, 'no_hp') || null);
    await sql`insert into guru (user_id, nip) values (${id}, ${nip || null})`;
  } catch (e) {
    kembali('/admin/guru', { err: galatUnik(e, 'Username sudah dipakai.') });
  }
  kembali('/admin/guru', { ok: `Guru ${nama} ditambahkan. Kata sandi awal: ${sandi}` });
}

export async function tambahOrtu(fd: FormData) {
  await admin();
  const siswaId = Number(fd.get('siswa_id'));
  const ortuLama = Number(fd.get('ortu_id')) || null;
  const hubungan = teks(fd, 'hubungan') || 'Wali';
  if (!siswaId) kembali('/admin/ortu', { err: 'Pilih siswa.' });
  let pesan = 'Orang tua dihubungkan dengan siswa.';
  try {
    if (ortuLama) {
      await sql`insert into ortu_siswa (ortu_id, siswa_id, hubungan) values (${ortuLama}, ${siswaId}, ${hubungan}) on conflict do nothing`;
    } else {
      const nama = teks(fd, 'nama');
      const username = teks(fd, 'username');
      if (!nama || !username) kembali('/admin/ortu', { err: 'Isi nama dan username orang tua, atau pilih akun yang sudah ada.' });
      const sandi = await sandiBaru();
      const id = await buatAkun(username, nama, 'ortu', sandi, teks(fd, 'no_hp') || null);
      await sql`insert into ortu_siswa (ortu_id, siswa_id, hubungan) values (${id}, ${siswaId}, ${hubungan})`;
      pesan = `Akun orang tua ${nama} dibuat. Kata sandi awal: ${sandi}`;
    }
  } catch (e) {
    kembali('/admin/ortu', { err: galatUnik(e, 'Username sudah dipakai.') });
  }
  kembali('/admin/ortu', { ok: pesan });
}

export async function lepasOrtu(fd: FormData) {
  await admin();
  await sql`delete from ortu_siswa where ortu_id = ${Number(fd.get('ortu_id'))} and siswa_id = ${Number(fd.get('siswa_id'))}`;
  kembali('/admin/ortu', { ok: 'Hubungan orang tua–siswa dilepas.' });
}

export async function resetSandi(fd: FormData) {
  const user = await admin();
  const id = Number(fd.get('id'));
  const sandi = await sandiBaru();
  const [u] = await sql`update users set password_hash = ${await bcrypt.hash(sandi, 10)}, gagal_login = 0, kunci_sampai = null
    where id = ${id} and id <> ${user.id} returning nama`;
  kembali(String(fd.get('kembali') || '/admin'), u ? { ok: `Kata sandi ${u.nama} direset menjadi: ${sandi}` } : { err: 'Pengguna tidak ditemukan.' });
}

export async function aturAktif(fd: FormData) {
  const user = await admin();
  const id = Number(fd.get('id'));
  if (id === user.id) kembali(String(fd.get('kembali') || '/admin'), { err: 'Tidak bisa menonaktifkan akun sendiri.' });
  await sql`update users set aktif = not aktif where id = ${id}`;
  kembali(String(fd.get('kembali') || '/admin'), { ok: 'Status akun diperbarui.' });
}

/* ---------- Jadwal (KF-12) ---------- */
export async function tambahJadwal(fd: FormData) {
  await admin();
  const kelasId = Number(fd.get('kelas_id'));
  const tujuan = `/admin/jadwal?kelas=${kelasId}`;
  const pengampuId = Number(fd.get('pengampu_id'));
  const hari = Number(fd.get('hari'));
  const jamKe = Number(fd.get('jam_ke'));
  const mulai = teks(fd, 'jam_mulai');
  const selesai = teks(fd, 'jam_selesai');
  if (!pengampuId || !(hari >= 1 && hari <= 6) || !(jamKe >= 1 && jamKe <= 8) || !mulai || !selesai || selesai <= mulai) {
    kembali(tujuan, { err: 'Lengkapi isian jadwal; jam selesai harus setelah jam mulai.' });
  }
  const [p] = await sql`select p.guru_id, p.kelas_id, g.nama from pengampu p join users g on g.id = p.guru_id where p.id = ${pengampuId}`;
  if (!p || p.kelas_id !== kelasId) kembali(tujuan, { err: 'Mapel tidak ditemukan di kelas ini.' });

  const [bentrokKelas] = await sql`select 1 from jadwal j join pengampu x on x.id = j.pengampu_id where x.kelas_id = ${kelasId} and j.hari = ${hari} and j.jam_ke = ${jamKe}`;
  if (bentrokKelas) kembali(tujuan, { err: 'Slot itu sudah terisi mapel lain di kelas ini.' });
  const [bentrokGuru] = await sql`
    select k.nama from jadwal j join pengampu x on x.id = j.pengampu_id join kelas k on k.id = x.kelas_id
    where x.guru_id = ${p.guru_id} and j.hari = ${hari} and j.jam_ke = ${jamKe}`;
  if (bentrokGuru) kembali(tujuan, { err: `Guru bentrok: ${p.nama} sudah mengajar di kelas ${bentrokGuru.nama} pada jam yang sama.` });

  await sql`insert into jadwal (pengampu_id, hari, jam_ke, jam_mulai, jam_selesai) values (${pengampuId}, ${hari}, ${jamKe}, ${mulai}, ${selesai})`;
  kembali(tujuan, { ok: 'Jadwal ditambahkan.' });
}

export async function hapusJadwal(fd: FormData) {
  await admin();
  await sql`delete from jadwal where id = ${Number(fd.get('id'))}`;
  kembali(`/admin/jadwal?kelas=${Number(fd.get('kelas_id'))}`, { ok: 'Jadwal dihapus.' });
}

/* ---------- Bobot nilai (KF-25) ---------- */
export async function simpanBobot(fd: FormData) {
  await admin();
  const ta = await tahunAktif();
  const b = ['tugas', 'uh', 'pts', 'pas'].map((k) => angka(fd, k) ?? -1);
  if (!ta || b.some((x) => x < 0 || x > 100 || !Number.isInteger(x)) || b.reduce((a, c) => a + c, 0) !== 100) {
    kembali('/admin/bobot', { err: 'Bobot harus bilangan bulat dan jumlahnya 100%.' });
  }
  await sql`insert into bobot_nilai (tahun_ajaran_id, tugas, uh, pts, pas) values (${ta.id}, ${b[0]}, ${b[1]}, ${b[2]}, ${b[3]})
    on conflict (tahun_ajaran_id) do update set tugas = excluded.tugas, uh = excluded.uh, pts = excluded.pts, pas = excluded.pas`;
  kembali('/admin/bobot', { ok: 'Bobot nilai disimpan. Nilai akhir otomatis dihitung ulang.' });
}

/* ---------- Laporan pesan (KF-31) ---------- */
export async function tindakLaporan(fd: FormData) {
  await admin();
  const jenis = teks(fd, 'jenis');
  const id = Number(fd.get('id'));
  const hapus = fd.get('aksi') === 'hapus';
  if (jenis === 'diskusi') {
    await sql`update pesan_diskusi set dilaporkan = false ${hapus ? sql`, dihapus = true` : sql``} where id = ${id}`;
  } else if (hapus) {
    await sql`delete from pesan_langsung where id = ${id}`;
  } else {
    await sql`update pesan_langsung set dilaporkan = false where id = ${id}`;
  }
  kembali('/admin/laporan', { ok: hapus ? 'Pesan dihapus.' : 'Laporan diabaikan.' });
}

/* ---------- Reset data demo (KF-33) ---------- */
export async function resetDemo(fd: FormData) {
  await admin();
  const s = await sekolah();
  if (!s.mode_demo) kembali('/admin/reset', { err: 'Reset hanya tersedia saat mode demo aktif.' });
  if (teks(fd, 'konfirmasi').toUpperCase() !== 'RESET') kembali('/admin/reset', { err: 'Ketik RESET untuk konfirmasi.' });
  await hapusSemuaFile();
  await isiDataDemo(sql);
  revalidatePath('/', 'layout');
  kembali('/dashboard', { ok: 'Data demo dan semua file uji coba sudah dikembalikan ke kondisi awal.' });
}
