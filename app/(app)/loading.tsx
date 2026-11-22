/** Kerangka halaman yang langsung tampil saat berpindah menu, sambil data dimuat. */
export default function Memuat() {
  return (
    <div className="animate-pulse" aria-label="Memuat">
      <div className="mb-5 h-28 rounded-3xl bg-navy-100" />
      <div className="mb-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-24 rounded-2xl bg-emas-100" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-2xl bg-white" />
        <div className="h-56 rounded-2xl bg-white" />
      </div>
    </div>
  );
}
