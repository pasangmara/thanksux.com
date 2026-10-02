import "server-only";
import postgres from "postgres";
import { env } from "@/lib/env";
import type { StoredFile } from "@/lib/domain/types";
import type { ListOptions, Row, Store, TableName, Where } from "./store";

/**
 * Postgres implementation (works with Supabase Postgres or any Postgres 14+).
 * Schema: db/migrations/*.sql. Every table/column name comes from code, never
 * from user input, and values are always sent as bound parameters.
 */

const TABLES: ReadonlySet<TableName> = new Set([
  "team_members",
  "sessions",
  "clients",
  "feedback",
  "activity",
  "settings",
  "outbox",
]);

/** jsonb columns per table: written with sql.json(), read back as objects. */
const JSON_COLUMNS: Partial<Record<TableName, readonly string[]>> = {
  settings: ["data"],
  outbox: ["payload"],
};

type Sql = ReturnType<typeof postgres>;

declare global {
  var __argusSql: Sql | undefined;
}

function getSql(): Sql {
  if (!globalThis.__argusSql) {
    globalThis.__argusSql = postgres(env.databaseUrl, {
      max: 5,
      idle_timeout: 20,
      // Supabase's transaction pooler (port 6543) does not support prepared statements.
      prepare: false,
      // Keep DATE columns as "YYYY-MM-DD" strings (no timezone surprises).
      types: {
        date: {
          to: 1082,
          from: [1082],
          serialize: (x: string) => x,
          parse: (x: string) => x,
        },
      },
      onnotice: () => {},
    });
  }
  return globalThis.__argusSql;
}

function assertTable(table: TableName) {
  if (!TABLES.has(table)) throw new Error(`Unknown table ${table}`);
}

/** timestamptz → ISO string so rows look the same as in demo mode. */
function normalize<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) out[k] = v instanceof Date ? v.toISOString() : v;
  return out as T;
}

export function createPostgresStore(): Store {
  const sql = getSql();

  const whereClause = (where?: Where) => {
    const entries = Object.entries(where ?? {});
    if (!entries.length) return sql``;
    const parts = entries.map(([k, v]) => (v === null ? sql`${sql(k)} is null` : sql`${sql(k)} = ${v}`));
    return sql`where ${parts.reduce((acc, p) => sql`${acc} and ${p}`)}`;
  };

  const prepareValues = (table: TableName, row: Record<string, unknown>) => {
    const jsonCols = JSON_COLUMNS[table] ?? [];
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v === undefined) continue;
      // postgres.js types sql.json loosely; the cast is safe for any JSON-serialisable value.
      out[k] = jsonCols.includes(k) ? sql.json(v as Parameters<typeof sql.json>[0]) : v;
    }
    return out;
  };

  return {
    kind: "postgres",

    async list<T extends Row>(table: TableName, opts: ListOptions = {}) {
      assertTable(table);
      const order = opts.orderBy
        ? opts.orderBy.dir === "desc"
          ? sql`order by ${sql(opts.orderBy.column)} desc`
          : sql`order by ${sql(opts.orderBy.column)} asc`
        : sql``;
      const limit = opts.limit ? sql`limit ${opts.limit}` : sql``;
      const rows = await sql`select * from ${sql(table)} ${whereClause(opts.where)} ${order} ${limit}`;
      return rows.map((r) => normalize<T>(r));
    },

    async get<T extends Row>(table: TableName, id: string) {
      assertTable(table);
      const rows = await sql`select * from ${sql(table)} where id = ${id} limit 1`;
      return rows[0] ? normalize<T>(rows[0]) : null;
    },

    async findOne<T extends Row>(table: TableName, where: Where) {
      assertTable(table);
      const rows = await sql`select * from ${sql(table)} ${whereClause(where)} limit 1`;
      return rows[0] ? normalize<T>(rows[0]) : null;
    },

    async insert<T extends Row>(table: TableName, row: T) {
      assertTable(table);
      const values = prepareValues(table, row as unknown as Record<string, unknown>);
      const rows = await sql`insert into ${sql(table)} ${sql(values)} returning *`;
      return normalize<T>(rows[0]);
    },

    async update<T extends Row>(table: TableName, id: string, patch: Partial<T>) {
      assertTable(table);
      const values = prepareValues(table, patch as Record<string, unknown>);
      delete values.id;
      if (!Object.keys(values).length) return this.get<T>(table, id);
      const rows = await sql`update ${sql(table)} set ${sql(values)} where id = ${id} returning *`;
      return rows[0] ? normalize<T>(rows[0]) : null;
    },

    async remove(table: TableName, id: string) {
      assertTable(table);
      await sql`delete from ${sql(table)} where id = ${id}`;
    },

    async removeWhere(table: TableName, where: Where) {
      assertTable(table);
      if (!Object.keys(where).length) throw new Error("removeWhere needs a filter");
      await sql`delete from ${sql(table)} ${whereClause(where)}`;
    },

    async count(table: TableName, where?: Where) {
      assertTable(table);
      const rows = await sql`select count(*)::int as n from ${sql(table)} ${whereClause(where)}`;
      return Number(rows[0]?.n ?? 0);
    },

    async putFile(file: StoredFile) {
      await sql`insert into files (id, name, mime, size, created_at, data)
                values (${file.id}, ${file.name}, ${file.mime}, ${file.size}, ${file.created_at}, ${file.data})`;
    },

    async getFile(id: string) {
      const rows = await sql`select * from files where id = ${id} limit 1`;
      if (!rows[0]) return null;
      const r = normalize<StoredFile>(rows[0]);
      return { ...r, data: Buffer.from(rows[0].data as Uint8Array) };
    },
  };
}
