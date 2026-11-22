import Link from 'next/link';

export default function TidakDiizinkan() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card max-w-sm text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-2 text-lg font-bold">Akses ditolak</h1>
        <p className="mt-1 text-sm text-slate-500">Halaman ini tidak tersedia untuk peran Anda.</p>
        <Link href="/dashboard" className="btn-primary mt-4">Kembali ke Dashboard</Link>
      </div>
    </main>
  );
}
