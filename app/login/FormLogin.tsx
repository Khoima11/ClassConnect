'use client';

import { useActionState } from 'react';
import { login, type HasilLogin } from './actions';

export default function FormLogin({ lanjut }: { lanjut: string }) {
  const [state, aksi, pending] = useActionState<HasilLogin, FormData>(login, {});
  return (
    <form action={aksi} className="space-y-4">
      <input type="hidden" name="lanjut" value={lanjut} />
      <label className="block">
        <span className="label">Username / NISN / NIP</span>
        <input name="username" className="input" autoComplete="username" required />
      </label>
      <label className="block">
        <span className="label">Kata sandi</span>
        <input name="password" type="password" className="input" autoComplete="current-password" required />
      </label>
      {state.galat && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.galat}</p>}
      <button className="btn-primary w-full" disabled={pending}>{pending ? 'Memeriksa...' : 'Masuk'}</button>
      <p className="text-center text-xs text-slate-500">Lupa kata sandi? Hubungi operator madrasah untuk direset.</p>
    </form>
  );
}
