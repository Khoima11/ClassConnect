import postgres from 'postgres';

const g = globalThis as unknown as { __sql?: postgres.Sql };

export type InfoKoneksi = {
  host: string;
  port: number;
  user: string;
  database: string;
  password: string;
  catatan: string[];
};

/**
 * Membaca DATABASE_URL dengan toleran terhadap kesalahan isian yang umum:
 * - spasi atau tanda kutip yang ikut tersalin,
 * - tanda [ ] dari "[YOUR-PASSWORD]" yang belum dihapus,
 * - password berisi simbol (@ # / ? : %) yang tidak di-encode.
 */
export function bacaDatabaseUrl(mentah: string | undefined): InfoKoneksi | null {
  if (!mentah) return null;
  const catatan: string[] = [];
  let url = mentah.trim().replace(/^['"]|['"]$/g, '').trim();
  if (url.startsWith('DATABASE_URL=')) {
    url = url.slice('DATABASE_URL='.length);
    catatan.push('Tulisan "DATABASE_URL=" ikut tersalin ke kolom Value.');
  }
  const m = url.match(/^postgres(?:ql)?:\/\/([^:@/?#]+)(?::(.*))?@([^@/:?#]+)(?::(\d+))?(?:\/([^?#]*))?/);
  if (!m) return null;
  const [, user, passMentah, host, port, db] = m;
  let password = passMentah ?? '';
  if (password.startsWith('[') && password.endsWith(']')) {
    password = password.slice(1, -1);
    catatan.push('Tanda [ ] di sekitar password belum dihapus (sudah diabaikan otomatis).');
  }
  try {
    // Jika password sudah di-encode (mis. %40 untuk @), kembalikan ke bentuk aslinya.
    if (/%[0-9A-Fa-f]{2}/.test(password)) password = decodeURIComponent(password);
  } catch {
    /* biarkan apa adanya */
  }
  return { host, port: Number(port) || 5432, user: decodeURIComponent(user), database: db || 'postgres', password, catatan };
}

function buat() {
  const info = bacaDatabaseUrl(process.env.DATABASE_URL);
  const opsi = {
    prepare: false, // wajib untuk Supabase transaction pooler (port 6543)
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
    onnotice: () => {},
    types: {
      numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => parseFloat(x) },
      date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    },
  };
  if (!info) return postgres('postgres://localhost:5432/classconnect', { ...opsi, ssl: false });
  return postgres({
    ...opsi,
    host: info.host,
    port: info.port,
    user: info.user,
    password: info.password,
    database: info.database,
    ssl: /supabase\.(co|com)$/.test(info.host) ? 'require' : false,
  });
}

export const sql: postgres.Sql = g.__sql ?? buat();
if (process.env.NODE_ENV !== 'production') g.__sql = sql;
