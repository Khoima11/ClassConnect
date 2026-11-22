import { InputFile, TombolKirim } from '@/components/client';
import { Bidang, Judul, Kartu } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sekolah } from '@/lib/data';
import { linkFile } from '@/lib/storage';
import { simpanSekolah } from '../actions';

export const dynamic = 'force-dynamic';

export default async function PengaturanSekolah() {
  await requireUser(['admin']);
  const s = await sekolah();
  const logo = linkFile(s.logo_path);
  return (
    <>
      <Judul judul="Pengaturan Sekolah" sub="Ubah identitas di sini saat sudah ada sekolah sasaran, tanpa mengubah kode." />
      <Kartu className="max-w-2xl">
        <form action={simpanSekolah} className="space-y-4">
          <Bidang label="Nama madrasah"><input name="nama" defaultValue={s.nama} className="input" required /></Bidang>
          <div className="grid gap-4 sm:grid-cols-2">
            <Bidang label="NSM"><input name="nsm" defaultValue={s.nsm ?? ''} className="input" /></Bidang>
            <Bidang label="Nama kepala madrasah"><input name="kepala_nama" defaultValue={s.kepala_nama ?? ''} className="input" /></Bidang>
          </div>
          <Bidang label="Alamat"><textarea name="alamat" defaultValue={s.alamat ?? ''} rows={2} className="input" /></Bidang>
          <Bidang label="Logo">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo && <img src={logo} alt="" className="h-12 w-12 rounded-full object-contain ring-1 ring-slate-200" />}
              <div className="flex-1"><InputFile name="logo" gambarSaja /></div>
            </div>
          </Bidang>
          <label className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm">
            <input type="checkbox" name="mode_demo" defaultChecked={s.mode_demo} className="mt-0.5 h-4 w-4" />
            <span><b>Mode demo</b>: tampilkan pita &quot;Mode Demo&quot;, tombol masuk cepat di halaman login, dan menu Reset Data Demo. Saat mode demo mati, aplikasi tampil seperti sistem sungguhan dan menu Reset disembunyikan. Nyalakan sementara jika ingin mengembalikan data contoh.</span>
          </label>
          <TombolKirim>Simpan</TombolKirim>
        </form>
      </Kartu>
    </>
  );
}
