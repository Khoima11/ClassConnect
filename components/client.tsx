'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

export function TombolKirim({ children, className = 'btn-primary', konfirmasi }: { children: ReactNode; className?: string; konfirmasi?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (konfirmasi && !window.confirm(konfirmasi)) e.preventDefault();
      }}
    >
      {pending ? 'Memproses...' : children}
    </button>
  );
}

const MAKS = 2 * 1024 * 1024;
const TARGET_GAMBAR = 300 * 1024;

async function kecilkanGambar(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((ok, gagal) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = gagal;
    i.src = url;
  });
  let sisi = 1280;
  let mutu = 0.8;
  let hasil: Blob | null = null;
  for (let n = 0; n < 8; n++) {
    const skala = Math.min(1, sisi / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * skala);
    c.height = Math.round(img.height * skala);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    hasil = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/jpeg', mutu));
    if (hasil && hasil.size <= TARGET_GAMBAR) break;
    if (mutu > 0.5) mutu -= 0.1;
    else sisi = Math.round(sisi * 0.8);
  }
  URL.revokeObjectURL(url);
  if (!hasil) return file;
  const nama = file.name.replace(/\.[^.]+$/, '') + '.jpg';
  return new File([hasil], nama, { type: 'image/jpeg' });
}

/** Input file: gambar dikecilkan otomatis ke ±300 KB, file lain maksimal 2 MB (KF-20). */
export function InputFile({ name, accept, gambarSaja = false }: { name: string; accept?: string; gambarSaja?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [info, setInfo] = useState<string>('');
  const [galat, setGalat] = useState<string>('');

  return (
    <div>
      <input
        ref={ref}
        type="file"
        name={name}
        accept={accept ?? (gambarSaja ? 'image/*' : undefined)}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-navy-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-navy-700"
        onChange={async (e) => {
          setGalat('');
          setInfo('');
          const f = e.target.files?.[0];
          if (!f) return;
          let akhir = f;
          if (f.type.startsWith('image/') && f.type !== 'image/gif') {
            setInfo('Mengecilkan gambar...');
            try {
              akhir = await kecilkanGambar(f);
            } catch {
              akhir = f;
            }
          }
          if (akhir.size > MAKS) {
            setGalat('File lebih dari 2 MB. Kirim sebagai tautan (misalnya Google Drive).');
            setInfo('');
            e.target.value = '';
            return;
          }
          if (akhir !== f) {
            const dt = new DataTransfer();
            dt.items.add(akhir);
            e.target.files = dt.files;
          }
          setInfo(`${akhir.name} · ${Math.round(akhir.size / 1024)} KB${akhir !== f ? ' (sudah dikecilkan)' : ''}`);
        }}
      />
      {info && <p className="mt-1 text-xs text-slate-500">{info}</p>}
      {galat && <p className="mt-1 text-xs text-red-600">{galat}</p>}
      <p className="mt-1 text-xs text-slate-400">Gambar dikecilkan otomatis. File lain maksimal 2 MB.</p>
    </div>
  );
}

export function Pesan() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const ok = sp.get('ok');
  const err = sp.get('err');
  const [tampil, setTampil] = useState(true);

  useEffect(() => {
    setTampil(true);
    if (!ok && !err) return;
    const t = setTimeout(() => {
      setTampil(false);
      const p = new URLSearchParams(sp.toString());
      p.delete('ok');
      p.delete('err');
      router.replace(pathname + (p.size ? `?${p}` : ''), { scroll: false });
    }, 4000);
    return () => clearTimeout(t);
  }, [ok, err, pathname, router, sp]);

  if (!tampil || (!ok && !err)) return null;
  return (
    <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${err ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-hijau-50 text-hijau-700 ring-1 ring-hijau-100'}`}>
      {err ?? ok}
    </div>
  );
}

export type ItemMenu = { href: string; label: string; ikon: string };

function aktif(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/')) || (href !== '/dashboard' && pathname === href);
}

export function MenuSamping({ menu }: { menu: ItemMenu[] }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {menu.map((m) => (
        <Link
          key={m.href}
          href={m.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
            aktif(pathname, m.href) ? 'bg-white/15 text-white' : 'text-navy-100 hover:bg-white/10 hover:text-white'
          }`}
        >
          <span className="w-5 text-center" aria-hidden>{m.ikon}</span>
          {m.label}
        </Link>
      ))}
    </nav>
  );
}

/** Di HP: bilah navigasi bawah berisi 4 menu utama + tombol Menu. */
export function MenuBawah({ menu }: { menu: ItemMenu[] }) {
  const pathname = usePathname();
  const [buka, setBuka] = useState(false);
  useEffect(() => setBuka(false), [pathname]);
  const utama = menu.slice(0, 4);
  return (
    <>
      {buka && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setBuka(false)}>
          <div className="absolute bottom-16 left-0 right-0 max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-3 gap-2">
              {menu.map((m) => (
                <Link key={m.href} href={m.href} className={`flex flex-col items-center gap-1 rounded-lg p-3 text-center text-xs ${aktif(pathname, m.href) ? 'bg-navy-50 text-navy-700' : 'text-slate-600'}`}>
                  <span className="text-xl" aria-hidden>{m.ikon}</span>
                  {m.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white lg:hidden">
        {utama.map((m) => (
          <Link key={m.href} href={m.href} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${aktif(pathname, m.href) ? 'text-navy-700 font-semibold' : 'text-slate-500'}`}>
            <span className="text-lg" aria-hidden>{m.ikon}</span>
            {m.label}
          </Link>
        ))}
        <button type="button" onClick={() => setBuka((b) => !b)} className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${buka ? 'text-navy-700 font-semibold' : 'text-slate-500'}`}>
          <span className="text-lg" aria-hidden>☰</span>
          Menu
        </button>
      </nav>
    </>
  );
}

export function PilihAnak({ anak, aktifId }: { anak: { id: number; nama: string }[]; aktifId: number | null }) {
  const router = useRouter();
  if (anak.length < 2) return null;
  return (
    <select
      className="input w-auto py-1 text-xs"
      value={aktifId ?? ''}
      onChange={(e) => {
        document.cookie = `cc_anak=${e.target.value}; path=/; max-age=31536000`;
        router.refresh();
      }}
    >
      {anak.map((a) => (
        <option key={a.id} value={a.id}>{a.nama}</option>
      ))}
    </select>
  );
}

export function GulirKeBawah({ id }: { id: string }) {
  useEffect(() => {
    document.getElementById(id)?.scrollIntoView({ block: 'end' });
  }, [id]);
  return null;
}
