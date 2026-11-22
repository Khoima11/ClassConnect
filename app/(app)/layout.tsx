import Link from 'next/link';
import { Suspense } from 'react';
import { MenuBawah, MenuSamping, Pesan, PilihAnak, type ItemMenu } from '@/components/client';
import { logout } from '@/app/login/actions';
import { requireUser } from '@/lib/auth';
import { cekTenggat, jumlahNotifBaru, sekolah } from '@/lib/data';
import { LABEL_PERAN, type CurrentUser } from '@/lib/types';

function menuUntuk(u: CurrentUser): ItemMenu[] {
  const dash = { href: '/dashboard', label: 'Beranda', ikon: '🏠' };
  const umum = { href: '/pengumuman', label: 'Pengumuman', ikon: '📢' };
  switch (u.peran) {
    case 'admin':
      return [
        dash,
        { href: '/admin', label: 'Data Master', ikon: '🗂️' },
        { href: '/admin/jadwal', label: 'Jadwal', ikon: '🗓️' },
        umum,
        { href: '/rekap', label: 'Rekap', ikon: '📊' },
        { href: '/admin/laporan', label: 'Laporan Pesan', ikon: '🚩' },
        { href: '/admin/sekolah', label: 'Pengaturan', ikon: '⚙️' },
      ];
    case 'kepala':
      return [dash, { href: '/rekap', label: 'Rekap', ikon: '📊' }, umum, { href: '/jadwal', label: 'Jadwal', ikon: '🗓️' }];
    case 'guru':
      return [
        dash,
        { href: '/absensi', label: 'Absensi', ikon: '✅' },
        { href: '/tugas', label: 'Tugas', ikon: '📝' },
        { href: '/nilai', label: 'Nilai', ikon: '🎯' },
        { href: '/jadwal', label: 'Jadwal', ikon: '🗓️' },
        { href: '/diskusi', label: 'Diskusi', ikon: '💬' },
        { href: '/pesan', label: 'Pesan Ortu', ikon: '✉️' },
        umum,
        ...(u.waliKelas.length ? [{ href: '/rekap', label: 'Kelas Saya', ikon: '👥' }] : []),
      ];
    case 'siswa':
      return [
        dash,
        { href: '/tugas', label: 'Tugas', ikon: '📝' },
        { href: '/jadwal', label: 'Jadwal', ikon: '🗓️' },
        { href: '/nilai', label: 'Nilai', ikon: '🎯' },
        { href: '/absensi', label: 'Absensi', ikon: '✅' },
        { href: '/diskusi', label: 'Diskusi', ikon: '💬' },
        umum,
      ];
    case 'ortu':
      return [
        dash,
        { href: '/absensi', label: 'Absensi', ikon: '✅' },
        { href: '/nilai', label: 'Nilai', ikon: '🎯' },
        { href: '/pesan', label: 'Pesan', ikon: '✉️' },
        { href: '/tugas', label: 'Tugas', ikon: '📝' },
        { href: '/jadwal', label: 'Jadwal', ikon: '🗓️' },
        umum,
      ];
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  await cekTenggat(user);
  const [s, notif] = await Promise.all([sekolah(), jumlahNotifBaru(user.id)]);
  const menu = [...menuUntuk(user), { href: '/profil', label: 'Profil', ikon: '👤' }];

  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-navy-700 p-4 lg:flex">
        <Link href="/dashboard" className="mb-6 block px-2">
          <p className="text-lg font-bold text-white">ClassConnect</p>
          <p className="truncate text-xs text-navy-100">{s.nama}</p>
        </Link>
        <MenuSamping menu={menu} />
        <form action={logout} className="mt-auto pt-4">
          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-navy-100 hover:bg-white/10 hover:text-white">↩ Keluar</button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        {s.mode_demo && (
          <div className="bg-amber-100 px-4 py-1 text-center text-xs font-medium text-amber-900">Mode Demo · semua data fiktif</div>
        )}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy-900 lg:hidden">ClassConnect</p>
            <p className="truncate text-xs text-slate-500">
              {user.nama} · {LABEL_PERAN[user.peran]}
              {user.peran === 'guru' && user.waliKelas.length > 0 && ` · Wali ${user.waliKelas.map((k) => k.nama).join(', ')}`}
              {user.peran === 'siswa' && user.kelasNama && ` · ${user.kelasNama}`}
              {user.peran === 'ortu' && user.anakAktif && ` · Anak: ${user.anakAktif.nama} (${user.anakAktif.kelas_nama ?? '-'})`}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {user.peran === 'ortu' && <PilihAnak anak={user.anak} aktifId={user.anakAktif?.id ?? null} />}
            <Link href="/notifikasi" className="relative rounded-full p-2 hover:bg-slate-100" aria-label="Notifikasi">
              <span className="text-lg">🔔</span>
              {notif > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {notif > 99 ? '99+' : notif}
                </span>
              )}
            </Link>
            <form action={logout} className="lg:hidden">
              <button className="rounded-full p-2 text-sm text-slate-500 hover:bg-slate-100" aria-label="Keluar">↩</button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
          <Suspense>
            <Pesan />
          </Suspense>
          {children}
        </main>
      </div>
      <MenuBawah menu={menu} />
    </div>
  );
}
