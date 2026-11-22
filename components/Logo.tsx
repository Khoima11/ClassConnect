/** Logo ClassConnect: bintang delapan (madrasah), lengkung mihrab, dan tiga simpul terhubung (siswa–guru–orang tua). */
export function Logo({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label="Logo ClassConnect">
      <g fill="#E0A84A">
        <rect x="11" y="11" width="42" height="42" rx="2.5" />
        <rect x="11" y="11" width="42" height="42" rx="2.5" transform="rotate(45 32 32)" />
      </g>
      <circle cx="32" cy="32" r="16" fill="#24406B" />
      <path d="M24.5 43V32.5C24.5 27.3 28 23.6 32 20C36 23.6 39.5 27.3 39.5 32.5V43Z" fill="#FFFFFF" />
      <path d="M28.2 39.2L32 31.6L35.8 39.2Z" fill="none" stroke="#24406B" strokeWidth="1.6" strokeLinejoin="round" />
      <g fill="#E0A84A" stroke="#24406B" strokeWidth="1.3">
        <circle cx="32" cy="31.6" r="2.3" />
        <circle cx="28.2" cy="39.2" r="2.3" />
        <circle cx="35.8" cy="39.2" r="2.3" />
      </g>
    </svg>
  );
}

export function Merek({ terang = true, sub }: { terang?: boolean; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={40} />
      <div className="min-w-0 leading-tight">
        <p className={`text-lg font-extrabold ${terang ? 'text-white' : 'text-navy-900'}`}>
          Class<span className="text-emas-500">Connect</span>
        </p>
        {sub && <p className={`truncate text-[10px] font-semibold uppercase tracking-[0.15em] ${terang ? 'text-navy-100' : 'text-slate-500'}`}>{sub}</p>}
      </div>
    </div>
  );
}
