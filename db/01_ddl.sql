-- =====================================================================
-- ClassConnect: DDL (struktur database), 21 tabel
-- Cara pakai: Supabase > SQL Editor > New query > tempel seluruh isi file ini > Run.
-- Aman dijalankan ulang (memakai "if not exists").
-- File ini sama dengan db/schema.sql yang dipakai halaman /setup.
-- =====================================================================


create table if not exists sekolah (
  id int primary key default 1 check (id = 1),
  nama text not null,
  nsm text,
  alamat text,
  logo_path text,
  kepala_nama text,
  mode_demo boolean not null default true
);

create table if not exists users (
  id serial primary key,
  username text not null unique,
  password_hash text not null,
  nama text not null,
  peran text not null check (peran in ('admin', 'kepala', 'guru', 'siswa', 'ortu')),
  no_hp text,
  foto_path text,
  aktif boolean not null default true,
  gagal_login int not null default 0,
  kunci_sampai timestamptz,
  dibuat timestamptz not null default now()
);

create table if not exists tahun_ajaran (
  id serial primary key,
  nama text not null,
  semester text not null check (semester in ('Ganjil', 'Genap')),
  aktif boolean not null default false
);

create table if not exists kelas (
  id serial primary key,
  nama text not null,
  tingkat int not null check (tingkat between 7 and 9),
  tahun_ajaran_id int not null references tahun_ajaran(id) on delete cascade,
  wali_kelas_id int references users(id) on delete set null
);

create table if not exists guru (
  user_id int primary key references users(id) on delete cascade,
  nip text
);

create table if not exists siswa (
  user_id int primary key references users(id) on delete cascade,
  nisn text not null unique,
  jenis_kelamin char(1) check (jenis_kelamin in ('L', 'P')),
  kelas_id int references kelas(id) on delete set null
);

create table if not exists ortu_siswa (
  ortu_id int not null references users(id) on delete cascade,
  siswa_id int not null references users(id) on delete cascade,
  hubungan text not null default 'Wali',
  primary key (ortu_id, siswa_id)
);

create table if not exists mapel (
  id serial primary key,
  kode text not null unique,
  nama text not null,
  kelompok text not null check (kelompok in ('PAI', 'Umum'))
);

create table if not exists pengampu (
  id serial primary key,
  guru_id int not null references users(id) on delete cascade,
  mapel_id int not null references mapel(id) on delete cascade,
  kelas_id int not null references kelas(id) on delete cascade,
  nilai_terbit boolean not null default false,
  diskusi_terkunci boolean not null default false,
  unique (mapel_id, kelas_id)
);

create table if not exists jadwal (
  id serial primary key,
  pengampu_id int not null references pengampu(id) on delete cascade,
  hari int not null check (hari between 1 and 6),
  jam_ke int not null check (jam_ke between 1 and 8),
  jam_mulai time not null,
  jam_selesai time not null
);

create table if not exists pertemuan (
  id serial primary key,
  jadwal_id int not null references jadwal(id) on delete cascade,
  tanggal date not null,
  dibuat timestamptz not null default now(),
  unique (jadwal_id, tanggal)
);

create table if not exists absensi (
  id serial primary key,
  pertemuan_id int not null references pertemuan(id) on delete cascade,
  siswa_id int not null references users(id) on delete cascade,
  status char(1) not null check (status in ('H', 'S', 'I', 'A')),
  keterangan text,
  diubah_oleh int references users(id) on delete set null,
  diubah timestamptz not null default now(),
  unique (pertemuan_id, siswa_id)
);

create table if not exists tugas (
  id serial primary key,
  pengampu_id int not null references pengampu(id) on delete cascade,
  judul text not null,
  deskripsi text,
  tenggat timestamptz not null,
  lampiran_path text,
  lampiran_nama text,
  tautan text,
  boleh_terlambat boolean not null default true,
  dibuat timestamptz not null default now()
);

create table if not exists pengumpulan (
  id serial primary key,
  tugas_id int not null references tugas(id) on delete cascade,
  siswa_id int not null references users(id) on delete cascade,
  jawaban text,
  file_path text,
  file_nama text,
  tautan text,
  dikirim_pada timestamptz not null default now(),
  terlambat boolean not null default false,
  nilai numeric(5, 2),
  komentar text,
  dinilai_pada timestamptz,
  unique (tugas_id, siswa_id)
);

create table if not exists nilai (
  id serial primary key,
  pengampu_id int not null references pengampu(id) on delete cascade,
  siswa_id int not null references users(id) on delete cascade,
  komponen text not null check (komponen in ('UH', 'PTS', 'PAS')),
  urutan int not null default 1,
  nilai numeric(5, 2) not null check (nilai between 0 and 100),
  unique (pengampu_id, siswa_id, komponen, urutan)
);

create table if not exists bobot_nilai (
  tahun_ajaran_id int primary key references tahun_ajaran(id) on delete cascade,
  tugas int not null default 20,
  uh int not null default 30,
  pts int not null default 20,
  pas int not null default 30
);

create table if not exists pengumuman (
  id serial primary key,
  pembuat_id int references users(id) on delete set null,
  judul text not null,
  isi text not null,
  lampiran_path text,
  lampiran_nama text,
  sasaran_peran text check (sasaran_peran in ('guru', 'siswa', 'ortu')),
  sasaran_kelas_id int references kelas(id) on delete cascade,
  tayang_mulai timestamptz not null default now(),
  tayang_akhir timestamptz,
  disematkan boolean not null default false,
  dibuat timestamptz not null default now()
);

create table if not exists pengumuman_dibaca (
  pengumuman_id int not null references pengumuman(id) on delete cascade,
  user_id int not null references users(id) on delete cascade,
  dibaca_pada timestamptz not null default now(),
  primary key (pengumuman_id, user_id)
);

create table if not exists pesan_diskusi (
  id serial primary key,
  pengampu_id int not null references pengampu(id) on delete cascade,
  pengirim_id int not null references users(id) on delete cascade,
  isi text not null,
  dibuat timestamptz not null default now(),
  dihapus boolean not null default false,
  dilaporkan boolean not null default false
);

create table if not exists pesan_langsung (
  id serial primary key,
  pengirim_id int not null references users(id) on delete cascade,
  penerima_id int not null references users(id) on delete cascade,
  siswa_id int not null references users(id) on delete cascade,
  isi text not null,
  dibaca boolean not null default false,
  dilaporkan boolean not null default false,
  dibuat timestamptz not null default now()
);

create table if not exists notifikasi (
  id serial primary key,
  user_id int not null references users(id) on delete cascade,
  jenis text not null,
  judul text not null,
  tautan text,
  kunci text,
  dibaca boolean not null default false,
  dibuat timestamptz not null default now()
);

create index if not exists idx_absensi_siswa on absensi (siswa_id);
create index if not exists idx_pertemuan_tanggal on pertemuan (tanggal);
create index if not exists idx_notifikasi_user on notifikasi (user_id, dibaca);
create unique index if not exists idx_notifikasi_kunci on notifikasi (user_id, kunci) where kunci is not null;
create index if not exists idx_pesan_langsung on pesan_langsung (siswa_id, pengirim_id, penerima_id);
create index if not exists idx_pengumpulan_siswa on pengumpulan (siswa_id);

-- Keamanan: aktifkan RLS di semua tabel tanpa policy, sehingga tabel tidak bisa diakses
-- lewat Data API Supabase (publishable/anon key). Aplikasi terhubung langsung sebagai
-- pemilik tabel (postgres) lewat DATABASE_URL, jadi tidak terpengaruh.
do $$
declare t text;
begin
  foreach t in array array['sekolah','users','tahun_ajaran','kelas','guru','siswa','ortu_siswa','mapel','pengampu','jadwal',
    'pertemuan','absensi','tugas','pengumpulan','nilai','bobot_nilai','pengumuman','pengumuman_dibaca','pesan_diskusi',
    'pesan_langsung','notifikasi']
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end $$;
