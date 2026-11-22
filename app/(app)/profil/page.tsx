import { InputFile, TombolKirim } from '@/components/client';
import { Bidang, Judul, Kartu } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { linkFile } from '@/lib/storage';
import { LABEL_PERAN } from '@/lib/types';
import { ubahProfil, ubahSandi } from './actions';

export const dynamic = 'force-dynamic';

export default async function Profil() {
  const user = await requireUser();
  const foto = linkFile(user.foto_path);
  return (
    <>
      <Judul judul="Profil" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Kartu judul="Data diri">
          <div className="mb-4 flex items-center gap-4">
            {foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={foto} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-100 text-xl font-bold text-navy-700">{user.nama.charAt(0)}</div>
            )}
            <div>
              <p className="font-semibold">{user.nama}</p>
              <p className="text-sm text-slate-500">{LABEL_PERAN[user.peran]} · username: {user.username}</p>
              {user.kelasNama && <p className="text-sm text-slate-500">Kelas {user.kelasNama}</p>}
              {user.anak.length > 0 && <p className="text-sm text-slate-500">Anak: {user.anak.map((a) => `${a.nama} (${a.kelas_nama ?? '-'})`).join(', ')}</p>}
            </div>
          </div>
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
            <TombolKirim>Ganti Kata Sandi</TombolKirim>
          </form>
        </Kartu>
      </div>
    </>
  );
}
