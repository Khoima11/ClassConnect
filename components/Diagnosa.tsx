import type { Diagnosa } from '@/lib/diagnosa';

/** Halaman penjelasan ketika aplikasi belum bisa tersambung ke database. */
export function HalamanDiagnosa({ d }: { d: Diagnosa }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="card w-full max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Aplikasi belum tersambung ke database</p>
        <h1 className="mt-1 text-lg font-bold">{d.judul}</h1>
        <p className="mt-2 text-sm text-slate-700">{d.penyebab}</p>
        <h2 className="mt-4 text-sm font-semibold">Cara memperbaiki</h2>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {d.solusi.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        {d.catatan.length > 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            {d.catatan.map((c, i) => <p key={i}>⚠ {c}</p>)}
          </div>
        )}
        {(d.koneksi || d.detail) && (
          <div className="mt-4 rounded-lg bg-slate-100 p-3 font-mono text-xs text-slate-600">
            {d.koneksi && <p>Mencoba masuk sebagai: {d.koneksi}</p>}
            {d.detail && <p className="mt-1 break-all">Pesan dari server: {d.detail}</p>}
          </div>
        )}
        <p className="mt-4 text-xs text-slate-400">Password tidak pernah ditampilkan di halaman ini. Muat ulang halaman setelah perbaikan.</p>
      </div>
    </main>
  );
}
