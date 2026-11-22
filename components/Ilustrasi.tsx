/** Ilustrasi orisinal: deretan lengkung madrasah, bintang delapan, dan simpul yang saling terhubung. */
export function Ilustrasi({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 220" className={className} role="img" aria-label="Ilustrasi madrasah yang terhubung">
      <circle cx="232" cy="70" r="58" fill="#2E5089" />
      <circle cx="70" cy="160" r="40" fill="#2E5089" opacity="0.7" />
      {/* bangunan dengan tiga lengkung */}
      <rect x="58" y="96" width="204" height="100" rx="10" fill="#F6EBDA" />
      <rect x="58" y="96" width="204" height="18" rx="9" fill="#E0A84A" />
      {[92, 160, 228].map((x) => (
        <path key={x} d={`M${x - 22} 196V150C${x - 22} 136 ${x - 12} 126 ${x} 118C${x + 12} 126 ${x + 22} 136 ${x + 22} 150V196Z`} fill="#24406B" />
      ))}
      <path d="M150 196V160C150 152 154 147 160 142C166 147 170 152 170 160V196Z" fill="#E0A84A" />
      {/* kubah dan bintang */}
      <path d="M128 96C128 72 142 60 160 52C178 60 192 72 192 96Z" fill="#E0A84A" />
      <g transform="translate(160 36)" fill="#FFFFFF">
        <rect x="-8" y="-8" width="16" height="16" rx="1.5" />
        <rect x="-8" y="-8" width="16" height="16" rx="1.5" transform="rotate(45)" />
      </g>
      {/* simpul terhubung: siswa, guru, orang tua */}
      <g stroke="#E0A84A" strokeWidth="2.5" strokeDasharray="5 5" fill="none">
        <path d="M34 66C60 40 96 38 118 54" />
        <path d="M286 130C300 108 298 82 280 64" />
      </g>
      <g fill="#FFFFFF" stroke="#E0A84A" strokeWidth="3">
        <circle cx="30" cy="70" r="11" />
        <circle cx="288" cy="134" r="11" />
        <circle cx="276" cy="58" r="9" />
      </g>
      <g fill="#24406B">
        <circle cx="30" cy="67" r="3.5" /><path d="M23 77a7 7 0 0 1 14 0Z" />
        <circle cx="288" cy="131" r="3.5" /><path d="M281 141a7 7 0 0 1 14 0Z" />
        <circle cx="276" cy="56" r="3" /><path d="M270 64a6 6 0 0 1 12 0Z" />
      </g>
      {/* bintang kecil */}
      {[[40, 26], [300, 30], [212, 20], [24, 120]].map(([x, y]) => (
        <path key={`${x}-${y}`} d={`M${x} ${y - 5}L${x + 1.6} ${y - 1.6}L${x + 5} ${y}L${x + 1.6} ${y + 1.6}L${x} ${y + 5}L${x - 1.6} ${y + 1.6}L${x - 5} ${y}L${x - 1.6} ${y - 1.6}Z`} fill="#E0A84A" />
      ))}
    </svg>
  );
}
