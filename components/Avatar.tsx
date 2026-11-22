import { linkFile } from '@/lib/storage';
import type { CurrentUser } from '@/lib/types';

export function Avatar({ user, besar = false }: { user: CurrentUser; besar?: boolean }) {
  const foto = linkFile(user.foto_path);
  const ukuran = besar ? 'h-24 w-24 text-3xl' : 'h-10 w-10 text-sm';
  if (foto) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={foto} alt="" className={`${ukuran} shrink-0 rounded-full object-cover ring-2 ring-emas-500`} />;
  }
  const inisial = user.nama.split(/[\s,]+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
  return (
    <div className={`${ukuran} flex shrink-0 items-center justify-center rounded-full bg-navy-700 font-bold text-white ring-2 ring-emas-500`}>{inisial}</div>
  );
}
