import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { StoredFile } from "@/lib/domain/types";
import { buildSeed } from "./seed";
import type { AnyRow, ListOptions, Row, Store, TableName, Where } from "./store";

/**
 * Demo mode: everything lives in .data/hub.json (+ .data/files/*), seeded
 * with clearly-labelled sample data. Lets a developer or designer run the
 * full app with zero setup. Not for production: a single-process JSON file
 * has no concurrency guarantees. Reset with `npm run demo:reset`.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "hub.json");
const FILES_DIR = path.join(DATA_DIR, "files");

type Db = Record<TableName, AnyRow[]>;

const EMPTY: Db = {
  team_members: [],
  sessions: [],
  clients: [],
  feedback: [],
  activity: [],
  settings: [],
  outbox: [],
};

let cache: Db | null = null;
let writeChain: Promise<void> = Promise.resolve();

async function load(): Promise<Db> {
  if (cache) return cache;
  try {
    cache = { ...EMPTY, ...(JSON.parse(await fs.readFile(DB_FILE, "utf8")) as Partial<Db>) };
  } catch {
    cache = buildSeed();
    await persist();
  }
  return cache;
}

function persist(): Promise<void> {
  // Serialise writes so two quick actions never interleave on disk.
  writeChain = writeChain.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${DB_FILE}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(cache, null, 2));
    await fs.rename(tmp, DB_FILE);
  });
  return writeChain;
}

const matches = (row: AnyRow, where?: Where) =>
  Object.entries(where ?? {}).every(([k, v]) => (v === null ? row[k] == null : row[k] === v));

const clone = <T>(v: T): T => structuredClone(v);

export function createDemoStore(): Store {
  return {
    kind: "demo",

    async list<T extends Row>(table: TableName, opts: ListOptions = {}) {
      const db = await load();
      let rows = db[table].filter((r) => matches(r, opts.where));
      if (opts.orderBy) {
        const { column, dir } = opts.orderBy;
        rows = [...rows].sort((a, b) => {
          const av = a[column] as string | number | null;
          const bv = b[column] as string | number | null;
          if (av === bv) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          return (av < bv ? -1 : 1) * (dir === "desc" ? -1 : 1);
        });
      }
      if (opts.limit) rows = rows.slice(0, opts.limit);
      return clone(rows) as unknown as T[];
    },

    async get<T extends Row>(table: TableName, id: string) {
      const db = await load();
      const row = db[table].find((r) => r.id === id);
      return row ? (clone(row) as unknown as T) : null;
    },

    async findOne<T extends Row>(table: TableName, where: Where) {
      const db = await load();
      const row = db[table].find((r) => matches(r, where));
      return row ? (clone(row) as unknown as T) : null;
    },

    async insert<T extends Row>(table: TableName, row: T) {
      const db = await load();
      if (db[table].some((r) => r.id === row.id)) throw new Error(`Duplicate id in ${table}`);
      db[table].push(clone(row) as unknown as AnyRow);
      await persist();
      return clone(row);
    },

    async update<T extends Row>(table: TableName, id: string, patch: Partial<T>) {
      const db = await load();
      const idx = db[table].findIndex((r) => r.id === id);
      if (idx < 0) return null;
      const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
      db[table][idx] = { ...db[table][idx], ...clone(clean), id };
      await persist();
      return clone(db[table][idx]) as unknown as T;
    },

    async remove(table: TableName, id: string) {
      const db = await load();
      db[table] = db[table].filter((r) => r.id !== id);
      await persist();
    },

    async removeWhere(table: TableName, where: Where) {
      const db = await load();
      db[table] = db[table].filter((r) => !matches(r, where));
      await persist();
    },

    async count(table: TableName, where?: Where) {
      const db = await load();
      return db[table].filter((r) => matches(r, where)).length;
    },

    async putFile(file: StoredFile) {
      await fs.mkdir(FILES_DIR, { recursive: true });
      await fs.writeFile(path.join(FILES_DIR, file.id), file.data);
      await fs.writeFile(
        path.join(FILES_DIR, `${file.id}.json`),
        JSON.stringify({ ...file, data: undefined }),
      );
    },

    async getFile(id: string) {
      if (!/^[a-z0-9-]+$/i.test(id)) return null;
      try {
        const meta = JSON.parse(await fs.readFile(path.join(FILES_DIR, `${id}.json`), "utf8"));
        const data = await fs.readFile(path.join(FILES_DIR, id));
        return { ...meta, data } as StoredFile;
      } catch {
        return null;
      }
    },
  };
}
