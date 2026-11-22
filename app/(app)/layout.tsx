import Link from 'next/link';
import { Suspense } from 'react';
import { MenuBawah, MenuSamping, Pesan, PilihAnak } from '@/components/client';
import { Ikon } from '@/components/Ikon';
import { Avatar } from '@/components/Avatar';
import { Logo, Merek } from '@/components/Logo';
import { logout } from '@/app/login/actions';
import { requireUser } from '@/lib/auth';
import { cekTenggat, jumlahNotifBaru, sekolah } from '@/lib/data';
import { menuUntuk } from '@/lib/menu';
import { LABEL_PERAN, type CurrentUser } from '@/lib/types';

function keterangan(user: CurrentUser) {
  const bagian = [LABEL_PERAN[user.peran]];
  if (user.peran === 'guru' && user.waliKelas.length > 0) bagian.push(`Wali ${user.waliKelas.map((k) => k.nama).join(', ')}`);
  if (user.peran === 'siswa' && user.kelasNama) bagian.push(`Kelas ${user.kelasNama}`);
  if (user.peran === 'ortu' && user.anakAktif) bagian.push(`${user.anakAktif.nama} (${user.anakAktif.kelas_nama ?? '-'})`);
  return bagian.join(' · ');
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  await cekTenggat(user);
  const [s, notif] = await Promise.all([sekolah(), jumlahNotifBaru(user.id)]);
  const menu = [...menuUntuk(user), { href: '/profil', label: 'Profil', ikon: 'profil' }];

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy-700 p-4 lg:flex">
        <Link href="/dashboard" className="mb-6 block px-1">
          <Merek sub={s.nama} />
        </Link>
        <div className="flex-1 overflow-y-auto">
          <MenuSamping menu={menu} />
        </div>
        <div className="mt-4 rounded-2xl bg-navy-800 p-3">
          <div className="flex items-center gap-3">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.nama}</p>
              <p className="truncate text-[11px] text-navy-200">{LABEL_PERAN[user.peran]}</p>
            </div>
          </div>
          <form action={logout} className="mt-3">
            <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-white/20">
              <Ikon nama="keluar" className="h-4 w-4" /> Keluar
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        {s.mode_demo && (
          <div className="bg-emas-500 px-4 py-1 text-center text-[11px] font-bold uppercase tracking-wider text-navy-900">Mode Demo · semua data fiktif</div>
        )}
        <header className="sticky top-0 z-30 border-b border-[#ECE5D8] bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/profil" className="flex min-w-0 items-center gap-3">
              <span className="lg:hidden"><Logo size={34} /></span>
              <span className="hidden lg:block"><Avatar user={user} /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-navy-900">{user.nama}</p>
                <p className="truncate text-xs text-slate-500">{keterangan(user)}</p>
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-1.5">
              {user.peran === 'ortu' && <PilihAnak anak={user.anak} aktifId={user.anakAktif?.id ?? null} />}
              <Link href="/notifikasi" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emas-100 text-navy-800 hover:bg-emas-200" aria-label="Notifikasi">
                <Ikon nama="lonceng" />
                {notif > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {notif > 99 ? '99+' : notif}
                  </span>
                )}
              </Link>
              <form action={logout} className="lg:hidden">
                <button className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" aria-label="Keluar">
                  <Ikon nama="keluar" />
                </button>
              </form>
            </div>
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
