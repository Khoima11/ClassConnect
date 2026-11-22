'use client';

import { useActionState } from 'react';
import { login, type HasilLogin } from './actions';

export default function FormLogin({ lanjut }: { lanjut: string }) {
  const [state, aksi, pending] = useActionState<HasilLogin, FormData>(login, {});
  return (
    <form action={aksi} className="space-y-4">
      <input type="hidden" name="lanjut" value={lanjut} />
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-navy-900">Username / NISN / NIP</span>
        <input name="username" className="input border-white" autoComplete="username" autoCapitalize="none" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-bold text-navy-900">Kata sandi</span>
        <input name="password" type="password" className="input border-white" autoComplete="current-password" autoCapitalize="none" required />
      </label>
      {state.galat && <p className="rounded-xl bg-white px-3 py-2 text-sm font-medium text-red-700">{state.galat}</p>}
      <button className="btn-putih w-full py-3 text-sm" disabled={pending}>{pending ? 'Memeriksa...' : 'Masuk'}</button>
      <p className="text-center text-xs text-navy-800">Lupa kata sandi? Hubungi operator madrasah untuk direset.</p>
    </form>
  );
}
