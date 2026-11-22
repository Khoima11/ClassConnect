import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function TidakDiizinkan() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-latar p-4">
      <div className="card max-w-sm text-center">
        <div className="mx-auto flex justify-center"><Logo size={56} /></div>
        <h1 className="mt-2 text-lg font-bold">Akses ditolak</h1>
        <p className="mt-1 text-sm text-slate-500">Halaman ini tidak tersedia untuk peran Anda.</p>
        <Link href="/dashboard" className="btn-primary mt-4">Kembali ke Dashboard</Link>
      </div>
    </main>
  );
}
