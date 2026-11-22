import Link from 'next/link';
import type { ReactNode } from 'react';

export function Judul({ judul, sub, aksi }: { judul: string; sub?: ReactNode; aksi?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">{judul}</h1>
        {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
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
          {judul && <h2 className="text-base font-semibold">{judul}</h2>}
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
  return <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{children}</p>;
}

export function Statistik({ label, nilai, ket, href }: { label: string; nilai: ReactNode; ket?: string; href?: string }) {
  const isi = (
    <div className="card h-full">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy-900">{nilai}</p>
      {ket && <p className="mt-1 text-xs text-slate-500">{ket}</p>}
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
