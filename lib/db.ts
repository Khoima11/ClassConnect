import postgres from 'postgres';

const g = globalThis as unknown as { __sql?: postgres.Sql };

function buat() {
  const url = process.env.DATABASE_URL || 'postgres://localhost:5432/classconnect';
  const pakaiSsl = /supabase\.(co|com)/.test(url);
  return postgres(url, {
    prepare: false, // wajib untuk Supabase transaction pooler (port 6543)
    max: 5,
    idle_timeout: 20,
    onnotice: () => {},
    ssl: pakaiSsl ? 'require' : false,
    types: {
      numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => parseFloat(x) },
      date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    },
  });
}

export const sql: postgres.Sql = g.__sql ?? buat();
if (process.env.NODE_ENV !== 'production') g.__sql = sql;
