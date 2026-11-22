-- =====================================================================
-- ClassConnect: DML awal untuk SEKOLAH SUNGGUHAN (pengganti 02_dml_data_demo.sql)
-- Isinya hanya identitas madrasah, tahun ajaran aktif, bobot nilai, dan 1 akun admin.
-- Jalankan SETELAH 01_ddl.sql. Ganti teks yang ditandai GANTI sebelum menekan Run.
-- PERINGATAN: perintah truncate di bawah menghapus SEMUA data yang sudah ada.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

begin;

truncate sekolah, users, tahun_ajaran, kelas, guru, siswa, ortu_siswa, mapel, pengampu, jadwal, pertemuan, absensi,
  tugas, pengumpulan, nilai, bobot_nilai, pengumuman, pengumuman_dibaca, pesan_diskusi, pesan_langsung, notifikasi
  restart identity cascade;

insert into sekolah (id, nama, nsm, alamat, kepala_nama, mode_demo)
values (1, 'GANTI Nama Madrasah', null, null, null, false);

insert into tahun_ajaran (nama, semester, aktif) values ('2026/2027', 'Ganjil', true);
insert into bobot_nilai (tahun_ajaran_id) values (1);

-- Kata sandi admin di-hash dengan bcrypt (sama dengan yang dipakai aplikasi)
insert into users (username, password_hash, nama, peran)
values ('admin', extensions.crypt('GANTI-kata-sandi-admin', extensions.gen_salt('bf', 10)), 'Operator Madrasah', 'admin');

commit;
