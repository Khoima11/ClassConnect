# ClassConnect

Aplikasi web Sistem Informasi Manajemen Pendidikan (SIMDIK) untuk madrasah tsanawiyah. ClassConnect menyatukan absensi, jadwal, tugas, nilai, pengumuman, dan komunikasi antara siswa, guru, orang tua, dan pihak madrasah dalam satu aplikasi.

Versi ini adalah **versi demo**: aplikasinya berjalan seperti aplikasi sungguhan, tetapi memakai sekolah fiktif (*MTs Contoh ClassConnect*) dan data contoh. Saat sudah ada sekolah sasaran, identitas sekolah cukup diganti dari menu **Pengaturan Sekolah**, lalu data diimpor dari Excel.

Disusun oleh Kelompok 7 (Riska Ramadhani, Hani Wahda Rivera, Muhammad Aditiya), Manajemen Pendidikan Islam, UIN Raden Fatah Palembang.

---

## Akun demo

Semua akun demo memakai kata sandi **`demo123`**. Selama mode demo aktif, halaman login juga punya tombol masuk cepat.

| Peran | Username | Keterangan |
| --- | --- | --- |
| Admin | `admin` | Operator madrasah |
| Kepala Madrasah | `kepala` | Memantau rekap semua kelas |
| Guru + wali kelas | `guru1` | Guru Fikih dan SKI, wali kelas VII A |
| Guru lain | `guru2` … `guru6` | `guru2` wali VIII A, `guru3` wali IX A |
| Siswa | `siswa1` … `siswa30` | `siswa1`–`10` VII A, `11`–`20` VIII A, `21`–`30` IX A |
| Orang tua | `ortu1` … `ortu30` | `ortuN` adalah orang tua `siswaN` |

Siswa juga bisa login memakai NISN, dan guru memakai NIP.

## Fitur per peran

- **Admin:** pengaturan sekolah, tahun ajaran, kelas & wali kelas, mapel & guru pengampu, data siswa/guru/orang tua, impor Excel (CSV), jadwal dengan cek bentrok, bobot nilai, moderasi pesan yang dilaporkan, reset data demo.
- **Kepala Madrasah:** dashboard kehadiran per kelas, siswa dengan alpa terbanyak, rekap absensi & nilai semua kelas (bisa diunduh), pengumuman sekolah.
- **Guru:** jadwal mengajar, absensi per pertemuan (bawaan semua Hadir), tugas + penilaian, input nilai UH/PTS/PAS dengan nilai akhir otomatis, terbitkan nilai, diskusi kelas, pesan dengan orang tua, pengumuman ke kelas.
- **Wali kelas** (menu tambahan guru): rekap absensi & nilai kelasnya, koreksi absensi.
- **Siswa:** jadwal, tugas & pengumpulan (foto dikecilkan otomatis), nilai yang sudah terbit, riwayat absensi, diskusi kelas, pengumuman.
- **Orang tua:** ringkasan anak, absensi, status tugas, nilai, pesan ke guru/wali kelas, pengumuman.
- **Semua peran:** notifikasi di dalam aplikasi (ikon lonceng), profil, ganti kata sandi. Tampilan menyesuaikan HP dengan menu di bagian bawah layar.

## Teknologi

- **Next.js 15** (React 19, TypeScript, Tailwind CSS)
- **Supabase**: database PostgreSQL dan penyimpanan file (paket gratis)
- **Vercel**: hosting (paket Hobby gratis)

---

## Cara deploy (tanpa perlu memasang apa pun di laptop)

Semua langkah di bawah dilakukan lewat browser.

### 1. Upload ke GitHub

1. Ekstrak file zip ini.
2. Buat repository baru di GitHub, misalnya `classconnect`. Pilih **Private** jika tidak ingin kodenya dilihat orang lain.
3. Upload isi folder `classconnect` (bukan foldernya) dengan salah satu cara:
   - **Lewat browser:** di halaman repository, klik **Add file → Upload files**, seret semua isi folder, lalu klik **Commit changes**.
   - **Lewat Git:**
     ```bash
     cd classconnect
     git init
     git add .
     git commit -m "ClassConnect versi demo"
     git branch -M main
     git remote add origin https://github.com/NAMA-AKUN/classconnect.git
     git push -u origin main
     ```

> Jangan pernah meng-upload file `.env` atau `.env.local` ke GitHub. File-file ini sudah dikecualikan lewat `.gitignore`.

### 2. Siapkan Supabase

1. Masuk ke [supabase.com](https://supabase.com), klik **New project**.
2. Nama: `classconnect`, region: **Southeast Asia (Singapore)**. Buat **Database Password**, lalu catat.
3. Setelah project jadi, kumpulkan tiga nilai berikut:
   - **DATABASE_URL:** klik tombol **Connect** di bagian atas → pilih **Transaction pooler** (port **6543**) → salin URI-nya, lalu ganti `[YOUR-PASSWORD]` dengan Database Password tadi.
   - **SUPABASE_URL:** Project Settings → **Data API** (atau **API**) → *Project URL*.
   - **SUPABASE_SERVICE_ROLE_KEY:** Project Settings → **API Keys** → kunci `service_role` / *secret*. Kunci ini rahasia; jangan dibagikan atau di-upload ke GitHub.

### 3. Deploy di Vercel

1. Masuk ke [vercel.com](https://vercel.com) dengan akun GitHub, klik **Add New → Project**, lalu pilih repository `classconnect`.
2. Buka bagian **Environment Variables** dan isi:

   | Nama | Isi |
   | --- | --- |
   | `DATABASE_URL` | URI Transaction pooler dari langkah 2 |
   | `SUPABASE_URL` | Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Kunci service_role |
   | `SUPABASE_BUCKET` | `classconnect` |
   | `SESSION_SECRET` | Teks acak **minimal 32 karakter**, misalnya hasil password generator |

3. Klik **Deploy** dan tunggu sampai selesai.

### 4. Siapkan database (sekali saja)

1. Buka `https://NAMA-APLIKASI.vercel.app/setup`.
2. Pilih **Versi demo**, lalu klik **Siapkan Database Sekarang**. Tabel, tempat penyimpanan file, dan data contoh akan dibuat dalam beberapa detik.
3. Setelah itu, halaman otomatis pindah ke login. Halaman `/setup` hanya bisa dibuka selama database masih kosong.

**Alternatif manual (DDL + DML lewat SQL Editor Supabase):** jalankan `db/01_ddl.sql`, lalu `db/02_dml_data_demo.sql` (atau `db/03_dml_sekolah_kosong.sql` untuk sekolah sungguhan). Setelah itu, buat bucket Storage bernama `classconnect` (Private, batas 2 MB) secara manual, karena halaman `/setup` tidak dijalankan.

Selesai. Bagikan tautan aplikasinya ke penguji. Aplikasi bisa dibuka dari laptop maupun HP.

---

## Hal penting selama uji coba

- **Supabase menjeda project gratis yang sepi aktivitas selama seminggu.** Buka aplikasinya minimal seminggu sekali, dan cek sehari sebelum presentasi. Project yang terlanjur dijeda bisa diaktifkan lagi dari dashboard Supabase (**Restore project**).
- **Batas penyimpanan:** database 500 MB (data demo hanya sekitar 11 MB per semester) dan file 1 GB. Foto otomatis dikecilkan menjadi sekitar 300 KB, dan file lain dibatasi maksimal 2 MB. File yang lebih besar dikirim sebagai tautan Google Drive.
- **Reset Data Demo** (menu Admin → Data Master) menghapus semua data dan file hasil uji coba, lalu mengisi ulang data contoh dengan tanggal yang disesuaikan ke hari ini.
- Paket Hobby Vercel hanya untuk pemakaian non-komersial. Kalau nanti dipakai sekolah sungguhan, sekolah perlu paket berbayar atau server sendiri.

## Pindah ke sekolah sungguhan

1. Buat project Supabase baru (atau kosongkan yang lama), lalu buka `/setup` dan pilih **Sekolah sungguhan**. Database akan dibuat kosong, hanya dengan akun `admin`, dan mode demo mati.
2. Login sebagai admin, lalu isi **Pengaturan Sekolah** (nama, NSM, logo).
3. Buat kelas, mapel, dan guru pengampu, lalu impor siswa dan guru lewat **Impor dari Excel**. Templatenya bisa diunduh di halaman itu.
4. Susun jadwal. Setelah itu, aplikasi siap dipakai.

---

## Menjalankan di komputer sendiri (opsional, untuk pengembang)

Butuh Node.js 20 atau lebih baru.

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya
npm run db:setup             # buat tabel + data contoh (tambahkan -- --reset untuk mengisi ulang)
npm run dev                  # buka http://localhost:3000
```

Jika `SUPABASE_URL` tidak diisi, file unggahan disimpan di folder `.uploads` di komputer sendiri.

## Struktur folder

```
app/
  login/            halaman login + tombol akun demo
  setup/            penyiapan database pertama kali
  (app)/            semua halaman setelah login
    dashboard/      beranda per peran
    absensi/        absensi per pertemuan (KF-14 – KF-17)
    tugas/          tugas, pengumpulan, penilaian (KF-19 – KF-22)
    nilai/          input & tampilan nilai (KF-23 – KF-26)
    jadwal/         jadwal pelajaran (KF-13)
    pengumuman/     pengumuman (KF-27, KF-28)
    diskusi/        diskusi kelas–mapel (KF-29)
    pesan/          pesan orang tua–guru (KF-30)
    rekap/          rekap kelas untuk kepala/wali/admin (KF-17, KF-18)
    notifikasi/     notifikasi (KF-32)
    profil/         profil & ganti sandi (KF-03)
    admin/          data master, jadwal, impor, bobot, laporan, reset (KF-04 – KF-12, KF-31, KF-33)
  api/              unduh file, ekspor CSV, template impor
components/         komponen tampilan
lib/                koneksi database, sesi login, hak akses, data contoh, skema
db/schema.sql       skema database (21 tabel), dipakai /setup
db/01_ddl.sql       DDL untuk SQL Editor Supabase
db/02_dml_data_demo.sql      DML data contoh MTs fiktif
db/03_dml_sekolah_kosong.sql DML awal sekolah sungguhan (1 akun admin)
middleware.ts       pemeriksaan login & sesi 60 menit
```

## Catatan keamanan

- Kata sandi disimpan dalam bentuk hash bcrypt (KNF-02).
- Hak akses diperiksa di server untuk setiap halaman dan aksi, bukan hanya dengan menyembunyikan menu (KNF-03). Siswa hanya bisa melihat datanya sendiri, dan orang tua hanya data anaknya.
- Sesi login berakhir setelah 60 menit tidak aktif. Akun dikunci 5 menit setelah 5 kali salah kata sandi.
- File unggahan disimpan di bucket privat dan hanya bisa dibuka pengguna yang sudah login.
- Kunci `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai di server dan tidak pernah dikirim ke browser.
