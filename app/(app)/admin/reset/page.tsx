import { TombolKirim } from '@/components/client';
import { Judul, Kartu } from '@/components/ui';
import { requireUser } from '@/lib/auth';
import { sekolah } from '@/lib/data';
import { resetDemo } from '../actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export default async function Reset() {
  await requireUser(['admin']);
  const s = await sekolah();
  return (
    <>
      <Judul judul="Reset Data Demo" />
      <Kartu className="max-w-xl">
        {!s.mode_demo ? (
          <p className="text-sm">Mode demo sedang mati, jadi reset tidak tersedia. Ini mencegah data sekolah sungguhan terhapus.</p>
        ) : (
          <form action={resetDemo} className="space-y-4">
            <p className="text-sm">Reset akan:</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>menghapus <b>semua data</b> (termasuk data yang dibuat saat uji coba),</li>
              <li>menghapus <b>semua file unggahan</b> (lampiran tugas, foto, logo),</li>
              <li>mengisi ulang data contoh MTs fiktif dengan tanggal yang disesuaikan ke hari ini.</li>
            </ul>
            <label className="block">
              <span className="label">Ketik RESET untuk melanjutkan</span>
              <input name="konfirmasi" className="input" autoComplete="off" required />
            </label>
            <TombolKirim className="btn-danger" konfirmasi="Yakin mereset semua data demo?">Reset Sekarang</TombolKirim>
          </form>
        )}
      </Kartu>
    </>
  );
}
