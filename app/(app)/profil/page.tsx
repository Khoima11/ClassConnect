import { InputFile, TombolKirim } from '@/components/client';
import { Avatar } from '@/components/Avatar';
import { BarisMenu, Bidang, Kartu } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { menuUntuk } from '@/lib/menu';
import { LABEL_PERAN } from '@/lib/types';
import { ubahProfil, ubahSandi } from './actions';

export const dynamic = 'force-dynamic';

export default async function Profil() {
  const user = await requireUser();
  const menu = menuUntuk(user).filter((m) => m.href !== '/dashboard');
  const info = [
    user.kelasNama && `Kelas ${user.kelasNama}`,
    user.waliKelas.length > 0 && `Wali kelas ${user.waliKelas.map((k) => k.nama).join(', ')}`,
    user.anak.length > 0 && `Orang tua dari ${user.anak.map((a) => `${a.nama} (${a.kelas_nama ?? '-'})`).join(', ')}`,
  ].filter(Boolean);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="space-y-4">
        <section className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_3px_rgba(20,38,64,0.06)]">
          <div className="h-20 bg-navy-700" />
          <div className="-mt-12 flex flex-col items-center px-5 pb-5 text-center">
            <Avatar user={user} besar />
            <h1 className="mt-3 text-lg font-extrabold">{user.nama}</h1>
            <p className="text-sm text-slate-500">{LABEL_PERAN[user.peran]} · @{user.username}</p>
            {info.map((t) => <p key={String(t)} className="mt-1 text-xs text-slate-500">{t}</p>)}
          </div>
        </section>
        <div className="space-y-2">
          {menu.map((m) => <BarisMenu key={m.href + m.label} href={m.href} ikon={m.ikon} judul={m.label} ket={m.ket} />)}
          <BarisMenu href="/notifikasi" ikon="lonceng" judul="Notifikasi" ket="Pemberitahuan terbaru" />
        </div>
      </div>
      <div className="space-y-4">
        <Kartu judul="Data diri">
          <form action={ubahProfil} className="space-y-4">
            <Bidang label="Nomor HP"><input name="no_hp" defaultValue={user.no_hp ?? ''} className="input" /></Bidang>
            <Bidang label="Foto profil"><InputFile name="foto" gambarSaja /></Bidang>
            <TombolKirim>Simpan Profil</TombolKirim>
          </form>
        </Kartu>
        <Kartu judul="Ganti kata sandi">
          <form action={ubahSandi} className="space-y-4">
            <Bidang label="Kata sandi lama"><input name="lama" type="password" className="input" required autoComplete="current-password" /></Bidang>
            <Bidang label="Kata sandi baru" ket="Minimal 6 karakter"><input name="baru" type="password" className="input" required minLength={6} autoComplete="new-password" /></Bidang>
            <Bidang label="Ulangi kata sandi baru"><input name="ulang" type="password" className="input" required autoComplete="new-password" /></Bidang>
            <TombolKirim className="btn-emas">Ganti Kata Sandi</TombolKirim>
          </form>
        </Kartu>
      </div>
    </div>
  );
}
