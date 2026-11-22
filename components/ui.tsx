import Link from 'next/link';
import type { ReactNode } from 'react';
import { Ikon } from './Ikon';

export function Judul({ judul, sub, aksi }: { judul: string; sub?: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{judul}</h1>
        <span className="mt-1.5 block h-1 w-10 rounded-full bg-emas-500" />
        {sub && <p className="mt-2 text-sm text-slate-500">{sub}</p>}
      </div>
      {aksi && <div className="flex flex-wrap gap-2">{aksi}</div>}
    </div>
  );
}

export function Kartu({ judul, aksi, children, className = '' }: { judul?: string; aksi?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(judul || aksi) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {judul && <h2 className="text-sm font-extrabold uppercase tracking-wide text-navy-800">{judul}</h2>}
          {aksi}
        </div>
      )}
      {children}
    </section>
  );
}

const WARNA = {
  abu: 'bg-slate-100 text-slate-700',
  hijau: 'bg-hijau-100 text-hijau-700',
  biru: 'bg-navy-100 text-navy-700',
  kuning: 'bg-amber-100 text-amber-800',
  merah: 'bg-red-100 text-red-700',
};

export function Lencana({ warna = 'abu', children }: { warna?: keyof typeof WARNA; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${WARNA[warna]}`}>{children}</span>;
}

export function LencanaAbsen({ status }: { status: string }) {
  const peta: Record<string, [keyof typeof WARNA, string]> = {
    H: ['hijau', 'Hadir'], S: ['kuning', 'Sakit'], I: ['biru', 'Izin'], A: ['merah', 'Alpa'],
  };
  const [w, t] = peta[status] ?? ['abu', status];
  return <Lencana warna={w}>{t}</Lencana>;
}

export function Kosong({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-emas-300 bg-emas-50 p-6 text-center text-sm text-slate-500">{children}</p>;
}

export function Statistik({ label, nilai, ket, href }: { label: string; nilai: ReactNode; ket?: string; href?: string }) {
  const isi = (
    <div className="relative h-full overflow-hidden rounded-2xl bg-navy-700 p-4 text-white shadow-sm sm:p-5">
      <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emas-500/25" aria-hidden />
      <p className="relative text-[11px] font-bold uppercase tracking-wider text-navy-100">{label}</p>
      <p className="relative mt-1 text-2xl font-extrabold text-white">{nilai}</p>
      {ket && <p className="relative mt-1 text-xs text-emas-300">{ket}</p>}
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90">{isi}</Link> : isi;
}

export function TabelWadah({ children }: { children: ReactNode }) {
  return <div className="-mx-4 overflow-x-auto sm:mx-0">{children}</div>;
}

export function Bidang({ label, children, ket }: { label: string; children: ReactNode; ket?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {ket && <span className="mt-1 block text-xs text-slate-500">{ket}</span>}
    </label>
  );
}

export function nilaiTampil(n: number | null | undefined) {
  if (n == null) return '-';
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}


/** Kotak-kotak menu bergaya kartu krem dengan ikon (beranda). */
export function KotakMenu({ menu }: { menu: { href: string; label: string; ikon: string; ket?: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {menu.map((m) => (
        <Link key={m.href + m.label} href={m.href} className="group flex flex-col justify-between rounded-2xl bg-emas-100 p-3 transition hover:-translate-y-0.5 hover:bg-emas-200 hover:shadow-md sm:p-4">
          <span className="text-xs font-bold text-navy-900 sm:text-sm">{m.label}</span>
          <span className="mt-3 flex items-end justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-navy-700 shadow-sm group-hover:bg-navy-700 group-hover:text-emas-400">
              <Ikon nama={m.ikon} className="h-6 w-6" />
            </span>
            <Ikon nama="kanan" className="h-4 w-4 text-emas-600" tebal={2.4} />
          </span>
          {m.ket && <span className="mt-2 hidden text-[11px] text-slate-500 sm:block">{m.ket}</span>}
        </Link>
      ))}
    </div>
  );
}

/** Baris daftar bergaya referensi: ikon, judul, keterangan, panah. */
export function BarisMenu({ href, ikon, judul, ket, aktif = false }: { href: string; ikon: string; judul: string; ket?: string; aktif?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition ${aktif ? 'bg-emas-500 text-navy-900' : 'bg-emas-100 text-navy-900 hover:bg-emas-200'}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-navy-700"><Ikon nama={ikon} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{judul}</span>
        {ket && <span className="block truncate text-xs text-slate-600">{ket}</span>}
      </span>
      <Ikon nama="kanan" className="h-4 w-4 text-emas-600" tebal={2.4} />
    </Link>
  );
}
