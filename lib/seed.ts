// Data contoh MTs fiktif. Dipakai oleh `npm run db:setup` dan tombol Reset Data Demo (KF-33).
// Semua nama dan nomor di sini fiktif.
import bcrypt from 'bcryptjs';
import type postgres from 'postgres';

export const SANDI_DEMO = 'demo123';

const TZ = 'Asia/Jakarta';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
const tambahHari = (t: string, n: number) => {
  const d = new Date(t + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const hariDari = (t: string) => {
  const d = new Date(t + 'T00:00:00Z').getUTCDay();
  return d === 0 ? 7 : d;
};
const jamDariSekarang = (j: number) => new Date(Date.now() + j * 3600 * 1000);

function acak(benih: number) {
  let a = benih;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SISWA = [
  ['Ahmad Rizki Pratama', 'L'], ['Aisyah Nur Rahma', 'P'], ['Bagas Saputra', 'L'], ['Citra Ayu Lestari', 'P'],
  ['Dimas Arya Wibowo', 'L'], ['Fatimah Az-Zahra', 'P'], ['Fikri Ramadhan', 'L'], ['Hana Salsabila', 'P'],
  ['Ilham Maulana', 'L'], ['Khansa Aulia', 'P'],
  ['Muhammad Faris', 'L'], ['Nabila Putri', 'P'], ['Naufal Hakim', 'L'], ['Nayla Khairunnisa', 'P'],
  ['Rafi Alfarizi', 'L'], ['Rahma Dewi', 'P'], ['Raihan Akbar', 'L'], ['Salma Azizah', 'P'],
  ['Teguh Prasetyo', 'L'], ['Zahra Amelia', 'P'],
  ['Akmal Fadhil', 'L'], ['Alya Nurhaliza', 'P'], ['Dafa Kurniawan', 'L'], ['Dinda Maharani', 'P'],
  ['Farhan Hidayat', 'L'], ['Intan Permata', 'P'], ['Kevin Ardiansyah', 'L'], ['Laila Safitri', 'P'],
  ['Rizal Firmansyah', 'L'], ['Syifa Aulia', 'P'],
] as const;

const NAMA_AYAH = [
  'Hendra Pratama', 'Syamsul Bahri', 'Agus Saputra', 'Joko Susilo', 'Wawan Wibowo', 'Zainal Abidin', 'Rudi Hartono',
  'Yusuf Mansur', 'Irwan Maulana', 'Arif Rahman', 'Faisal Anwar', 'Darmawan', 'Lukman Hakim', 'Herman Syah',
  'Ridwan Kamil', 'Sutrisno', 'Bambang Akbar', 'Abdul Aziz', 'Slamet Prasetyo', 'Andi Firmansyah', 'Fadli Zulkarnain',
  'Hasan Basri', 'Eko Kurniawan', 'Suherman', 'Taufik Hidayat', 'Rahmat Permana', 'Doni Ardiansyah', 'Mulyadi',
  'Firman Utomo', 'Iskandar',
];

const GURU = [
  { u: 'guru1', nama: 'Ahmad Fauzi, S.Pd.I.', nip: '198503122010011001', mapel: ['FIQ', 'SKI'] },
  { u: 'guru2', nama: 'Siti Aminah, S.Ag.', nip: '198707082011012002', mapel: ['QH', 'AA'] },
  { u: 'guru3', nama: 'Rahmat Hidayat, S.Pd.', nip: '199001152015031003', mapel: ['MTK'] },
  { u: 'guru4', nama: 'Nurul Huda, Lc.', nip: '199204202019031004', mapel: ['BAR'] },
  { u: 'guru5', nama: 'Dewi Lestari, S.Pd.', nip: '199106302018012005', mapel: ['BIN'] },
  { u: 'guru6', nama: 'Budi Santoso, S.Si.', nip: '198912252014031006', mapel: ['IPA'] },
];

const MAPEL = [
  ['QH', "Al-Qur'an Hadis", 'PAI'], ['AA', 'Akidah Akhlak', 'PAI'], ['FIQ', 'Fikih', 'PAI'], ['SKI', 'Sejarah Kebudayaan Islam', 'PAI'],
  ['BAR', 'Bahasa Arab', 'PAI'], ['BIN', 'Bahasa Indonesia', 'Umum'], ['MTK', 'Matematika', 'Umum'], ['IPA', 'IPA', 'Umum'],
] as const;

const JAM: Record<number, [string, string]> = {
  1: ['07:30', '08:50'], 2: ['08:50', '10:10'], 3: ['10:30', '11:50'], 4: ['12:30', '13:50'],
};

const TABEL = [
  'notifikasi', 'pesan_langsung', 'pesan_diskusi', 'pengumuman_dibaca', 'pengumuman', 'bobot_nilai', 'nilai',
  'pengumpulan', 'tugas', 'absensi', 'pertemuan', 'jadwal', 'pengampu', 'mapel', 'ortu_siswa', 'siswa', 'guru',
  'kelas', 'tahun_ajaran', 'users', 'sekolah',
];

export async function isiDataDemo(sql: postgres.Sql) {
  const r = acak(20261121);
  const hash = await bcrypt.hash(SANDI_DEMO, 10);
  const hariIni = today();

  await sql.begin(async (tx) => {
    const q = tx as unknown as postgres.Sql;
    await q.unsafe(`truncate ${TABEL.join(', ')} restart identity cascade`);

    await q`insert into sekolah (id, nama, nsm, alamat, kepala_nama, mode_demo)
      values (1, 'MTs Contoh ClassConnect', '121216710000', 'Jl. Contoh No. 1, Palembang', 'H. Abdul Malik, S.Ag., M.Pd.', true)`;

    const [ta] = await q`insert into tahun_ajaran (nama, semester, aktif) values ('2026/2027', 'Ganjil', true) returning id`;
    await q`insert into bobot_nilai (tahun_ajaran_id) values (${ta.id})`;

    const tambahUser = async (username: string, nama: string, peran: string, no_hp: string | null = null) => {
      const [u] = await q`insert into users (username, password_hash, nama, peran, no_hp)
        values (${username}, ${hash}, ${nama}, ${peran}, ${no_hp}) returning id`;
      return u.id as number;
    };

    await tambahUser('admin', 'Operator Madrasah', 'admin', '081200000001');
    await tambahUser('kepala', 'H. Abdul Malik, S.Ag., M.Pd.', 'kepala', '081200000002');

    const guruId: Record<string, number> = {};
    for (const [i, g] of GURU.entries()) {
      const id = await tambahUser(g.u, g.nama, 'guru', `08121000000${i + 1}`);
      await q`insert into guru (user_id, nip) values (${id}, ${g.nip})`;
      guruId[g.u] = id;
    }

    const kelasDef = [
      { nama: 'VII A', tingkat: 7, wali: 'guru1' },
      { nama: 'VIII A', tingkat: 8, wali: 'guru2' },
      { nama: 'IX A', tingkat: 9, wali: 'guru3' },
    ];
    const kelasId: number[] = [];
    for (const k of kelasDef) {
      const [row] = await q`insert into kelas (nama, tingkat, tahun_ajaran_id, wali_kelas_id)
        values (${k.nama}, ${k.tingkat}, ${ta.id}, ${guruId[k.wali]}) returning id`;
      kelasId.push(row.id);
    }

    const siswaKelas: number[][] = [[], [], []];
    for (const [i, [nama, jk]] of SISWA.entries()) {
      const k = Math.floor(i / 10);
      const id = await tambahUser(`siswa${i + 1}`, nama, 'siswa');
      await q`insert into siswa (user_id, nisn, jenis_kelamin, kelas_id)
        values (${id}, ${String(1012026000 + i + 1).padStart(10, '0')}, ${jk}, ${kelasId[k]})`;
      siswaKelas[k].push(id);
      const ortu = await tambahUser(`ortu${i + 1}`, NAMA_AYAH[i], 'ortu', `0813${String(20000000 + i).slice(-8)}`);
      await q`insert into ortu_siswa (ortu_id, siswa_id, hubungan) values (${ortu}, ${id}, 'Ayah')`;
    }
    const semuaSiswa = siswaKelas.flat();

    const mapelId: Record<string, number> = {};
    for (const [kode, nama, kelompok] of MAPEL) {
      const [m] = await q`insert into mapel (kode, nama, kelompok) values (${kode}, ${nama}, ${kelompok}) returning id`;
      mapelId[kode] = m.id;
    }

    // Pengampu + jadwal tanpa bentrok (KF-12): 2 pertemuan per mapel per minggu.
    type P = { id: number; guru: number; kelasIdx: number; kode: string };
    const pengampu: P[] = [];
    const sibukGuru = new Set<string>();
    const sibukKelas = new Set<string>();
    const hariMapel = new Set<string>();
    const slot: [number, number][] = [];
    for (let jam = 1; jam <= 4; jam++) for (let hari = 1; hari <= 6; hari++) slot.push([hari, jam]);

    const bebanHari = (k: number, hari: number) => [1, 2, 3, 4].filter((j) => sibukKelas.has(`${k}-${hari}-${j}`)).length;
    let putar = 0;
    for (const g of GURU) {
      for (const kode of g.mapel) {
        for (let k = 0; k < 3; k++) {
          const [p] = await q`insert into pengampu (guru_id, mapel_id, kelas_id, nilai_terbit)
            values (${guruId[g.u]}, ${mapelId[kode]}, ${kelasId[k]}, ${!(kode === 'FIQ' && k === 0)}) returning id`;
          pengampu.push({ id: p.id, guru: guruId[g.u], kelasIdx: k, kode });
          // Pilih slot kosong pada hari yang paling sedikit jadwalnya agar tersebar merata Senin–Sabtu.
          for (let dapat = 0; dapat < 2; dapat++) {
            const kandidat = slot
              .map((sl, n) => ({ sl, urut: (n + putar) % slot.length }))
              .filter(({ sl: [hari, jam] }) =>
                !sibukGuru.has(`${guruId[g.u]}-${hari}-${jam}`) && !sibukKelas.has(`${k}-${hari}-${jam}`) && !hariMapel.has(`${k}-${kode}-${hari}`))
              .sort((a, b) => bebanHari(k, a.sl[0]) - bebanHari(k, b.sl[0]) || a.sl[1] - b.sl[1] || a.urut - b.urut);
            if (kandidat.length === 0) break;
            const [hari, jam] = kandidat[0].sl;
            sibukGuru.add(`${guruId[g.u]}-${hari}-${jam}`);
            sibukKelas.add(`${k}-${hari}-${jam}`);
            hariMapel.add(`${k}-${kode}-${hari}`);
            await q`insert into jadwal (pengampu_id, hari, jam_ke, jam_mulai, jam_selesai)
              values (${p.id}, ${hari}, ${jam}, ${JAM[jam][0]}, ${JAM[jam][1]})`;
          }
          putar += 5;
        }
      }
    }

    // Absensi 2 minggu terakhir (sebelum hari ini).
    const jadwal = await q`select j.id, j.hari, p.kelas_id from jadwal j join pengampu p on p.id = j.pengampu_id`;
    for (let d = 14; d >= 1; d--) {
      const tgl = tambahHari(hariIni, -d);
      const hari = hariDari(tgl);
      for (const j of jadwal.filter((x) => x.hari === hari)) {
        const [pt] = await q`insert into pertemuan (jadwal_id, tanggal) values (${j.id}, ${tgl}) returning id`;
        const siswa = siswaKelas[kelasId.indexOf(j.kelas_id)];
        const baris = siswa.map((sid) => {
          const x = r();
          const status = x < 0.92 ? 'H' : x < 0.95 ? 'S' : x < 0.98 ? 'I' : 'A';
          const keterangan = status === 'S' ? 'Demam' : status === 'I' ? 'Acara keluarga' : null;
          return { pertemuan_id: pt.id, siswa_id: sid, status, keterangan };
        });
        await q`insert into absensi ${q(baris, 'pertemuan_id', 'siswa_id', 'status', 'keterangan')}`;
      }
    }

    // Tugas: satu sudah lewat tenggat (dinilai), satu masih berjalan.
    const JUDUL: Record<string, [string, string]> = {
      QH: ['Hafalan QS. Al-Bayyinah ayat 1–5', 'Tulis kandungan QS. Al-Qadr'],
      AA: ['Rangkuman sifat wajib Allah', 'Contoh akhlak terpuji di rumah'],
      FIQ: ['Rangkuman tata cara salat jenazah', 'Laporan praktik wudu di rumah'],
      SKI: ['Peta dakwah Nabi di Makkah', 'Tokoh Khulafaur Rasyidin'],
      BAR: ['Mufradat tentang sekolah', 'Hiwar perkenalan diri'],
      BIN: ['Teks deskripsi tempat wisata', 'Ringkasan cerpen'],
      MTK: ['Latihan bilangan bulat', 'Soal perbandingan senilai'],
      IPA: ['Laporan pengamatan klasifikasi makhluk hidup', 'Gambar sistem pencernaan'],
    };
    for (const p of pengampu) {
      const siswa = siswaKelas[p.kelasIdx];
      const [lama, baru] = JUDUL[p.kode];
      const [t1] = await q`insert into tugas (pengampu_id, judul, deskripsi, tenggat, boleh_terlambat, dibuat)
        values (${p.id}, ${lama}, 'Kerjakan di buku tulis, lalu foto dan unggah hasilnya di sini.', ${jamDariSekarang(-24 * 5)}, true, ${jamDariSekarang(-24 * 10)})
        returning id`;
      for (const sid of siswa) {
        const x = r();
        if (x < 0.08) continue; // tidak mengumpulkan
        const terlambat = x > 0.9;
        await q`insert into pengumpulan (tugas_id, siswa_id, jawaban, dikirim_pada, terlambat, nilai, komentar, dinilai_pada)
          values (${t1.id}, ${sid}, 'Jawaban terlampir di buku tulis.', ${jamDariSekarang(terlambat ? -24 * 4 : -24 * 6)}, ${terlambat},
            ${Math.round(70 + r() * 28)}, ${r() > 0.6 ? 'Bagus, pertahankan.' : null}, ${jamDariSekarang(-24 * 3)})`;
      }
      const dekat = p.kode === 'FIQ' && p.kelasIdx === 0; // memicu notifikasi tenggat H-1
      const [t2] = await q`insert into tugas (pengampu_id, judul, deskripsi, tenggat, boleh_terlambat, dibuat)
        values (${p.id}, ${baru}, 'Tulis jawaban singkat, boleh dilengkapi foto.', ${jamDariSekarang(dekat ? 20 : 24 * 3)}, ${!dekat}, ${jamDariSekarang(-24 * 2)})
        returning id`;
      for (const sid of siswa.slice(2)) {
        if (r() > 0.35) continue;
        await q`insert into pengumpulan (tugas_id, siswa_id, jawaban, dikirim_pada)
          values (${t2.id}, ${sid}, 'Sudah saya kerjakan, mohon dinilai.', ${jamDariSekarang(-6)})`;
      }
    }

    // Nilai UH dan PTS.
    for (const p of pengampu) {
      const siswa = siswaKelas[p.kelasIdx];
      const baris: { pengampu_id: number; siswa_id: number; komponen: string; urutan: number; nilai: number }[] = [];
      for (const sid of siswa) {
        const dasar = 68 + r() * 25;
        baris.push({ pengampu_id: p.id, siswa_id: sid, komponen: 'UH', urutan: 1, nilai: Math.round(dasar + r() * 6) });
        if (['QH', 'AA', 'FIQ', 'MTK'].includes(p.kode)) {
          baris.push({ pengampu_id: p.id, siswa_id: sid, komponen: 'UH', urutan: 2, nilai: Math.round(dasar + r() * 6) });
        }
        baris.push({ pengampu_id: p.id, siswa_id: sid, komponen: 'PTS', urutan: 1, nilai: Math.round(dasar + r() * 5) });
      }
      await q`insert into nilai ${q(baris, 'pengampu_id', 'siswa_id', 'komponen', 'urutan', 'nilai')}`;
    }

    // Pengumuman.
    const [adminU] = await q`select id from users where username = 'admin'`;
    const [kepalaU] = await q`select id from users where username = 'kepala'`;
    await q`insert into pengumuman (pembuat_id, judul, isi, disematkan, tayang_mulai) values
      (${adminU.id}, 'Jadwal Penilaian Akhir Semester (PAS) Ganjil',
       ${'PAS semester ganjil dilaksanakan mulai ' + tambahHari(hariIni, 16) + ' selama 6 hari. Jadwal per mapel akan dibagikan wali kelas. Siswa wajib hadir 15 menit sebelum ujian dimulai.'},
       true, ${jamDariSekarang(-48)})`;
    await q`insert into pengumuman (pembuat_id, judul, isi, sasaran_peran, tayang_mulai) values
      (${kepalaU.id}, 'Undangan Pertemuan Orang Tua/Wali Siswa',
       'Bapak/Ibu orang tua/wali siswa kelas VII–IX diundang hadir pada pertemuan rutin di aula madrasah. Agenda: laporan perkembangan belajar dan program tahfiz.',
       'ortu', ${jamDariSekarang(-24)})`;
    await q`insert into pengumuman (pembuat_id, judul, isi, sasaran_kelas_id, tayang_mulai) values
      (${guruId.guru1}, 'Praktik salat jenazah pekan depan',
       'Untuk praktik Fikih pekan depan, siswa putra membawa sarung dan peci, siswa putri membawa mukena.',
       ${kelasId[0]}, ${jamDariSekarang(-5)})`;

    // Diskusi kelas Fikih VII A.
    const fikihVII = pengampu.find((p) => p.kode === 'FIQ' && p.kelasIdx === 0)!;
    const s = siswaKelas[0];
    await q`insert into pesan_diskusi (pengampu_id, pengirim_id, isi, dibuat) values
      (${fikihVII.id}, ${guruId.guru1}, 'Assalamualaikum. Silakan bertanya di sini kalau ada materi salat jenazah yang belum jelas.', ${jamDariSekarang(-30)}),
      (${fikihVII.id}, ${s[0]}, 'Waalaikumsalam, Pak. Salat jenazah berapa takbir ya, Pak?', ${jamDariSekarang(-29)}),
      (${fikihVII.id}, ${guruId.guru1}, 'Empat takbir, tanpa rukuk dan sujud. Nanti kita praktikkan bersama.', ${jamDariSekarang(-28)}),
      (${fikihVII.id}, ${s[1]}, 'Baik, Pak. Terima kasih.', ${jamDariSekarang(-27)})`;

    // Pesan orang tua siswa1 dengan wali kelas.
    const [ortu1] = await q`select id from users where username = 'ortu1'`;
    await q`insert into pesan_langsung (pengirim_id, penerima_id, siswa_id, isi, dibaca, dibuat) values
      (${ortu1.id}, ${guruId.guru1}, ${s[0]}, 'Assalamualaikum, Pak. Rizki kemarin pulang terlambat, apakah ada kegiatan tambahan di sekolah?', true, ${jamDariSekarang(-20)}),
      (${guruId.guru1}, ${ortu1.id}, ${s[0]}, 'Waalaikumsalam, Pak Hendra. Betul, kemarin ada latihan pramuka sampai pukul 16.00.', true, ${jamDariSekarang(-19)}),
      (${ortu1.id}, ${guruId.guru1}, ${s[0]}, 'Baik, terima kasih informasinya, Pak.', false, ${jamDariSekarang(-2)})`;

    // Beberapa notifikasi awal.
    await q`insert into notifikasi (user_id, jenis, judul, tautan) values
      (${guruId.guru1}, 'pesan', 'Pesan baru dari Hendra Pratama', '/pesan'),
      (${s[0]}, 'pengumuman', 'Pengumuman: Praktik salat jenazah pekan depan', '/pengumuman'),
      (${ortu1.id}, 'nilai', 'Nilai Matematika Ahmad Rizki Pratama sudah terbit', '/nilai')`;

    void semuaSiswa;
  });
}

/** Database kosong untuk sekolah sungguhan: hanya identitas sekolah, tahun ajaran, dan satu akun admin. */
export async function isiDataKosong(sql: postgres.Sql, namaSekolah: string, sandiAdmin: string) {
  const hash = await bcrypt.hash(sandiAdmin, 10);
  await sql.begin(async (tx) => {
    const q = tx as unknown as postgres.Sql;
    await q.unsafe(`truncate ${TABEL.join(', ')} restart identity cascade`);
    await q`insert into sekolah (id, nama, mode_demo) values (1, ${namaSekolah}, false)`;
    const tahun = Number(today().slice(0, 4));
    const bulan = Number(today().slice(5, 7));
    const awal = bulan >= 7 ? tahun : tahun - 1;
    const [ta] = await q`insert into tahun_ajaran (nama, semester, aktif)
      values (${`${awal}/${awal + 1}`}, ${bulan >= 7 ? 'Ganjil' : 'Genap'}, true) returning id`;
    await q`insert into bobot_nilai (tahun_ajaran_id) values (${ta.id})`;
    await q`insert into users (username, password_hash, nama, peran) values ('admin', ${hash}, 'Operator Madrasah', 'admin')`;
  });
}
