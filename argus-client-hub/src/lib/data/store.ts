import "server-only";
import { isDemoMode } from "@/lib/env";
import type { StoredFile } from "@/lib/domain/types";

/**
 * One small storage interface, two implementations:
 *   - PostgresStore (DATABASE_URL set, e.g. Supabase Postgres): production
 *   - DemoStore (no DATABASE_URL): JSON file in .data/, seeded with sample data
 *
 * Services in src/lib/services/* only talk to this interface, so the
 * whole app runs identically in both modes. Queries are deliberately
 * simple (equality filters, one ORDER BY). An agency has hundreds of
 * clients, not millions, so filtering and aggregation happen in services.
 */

export type TableName = "team_members" | "sessions" | "clients" | "feedback" | "activity" | "settings" | "outbox";

export type Row = { id: string };
export type AnyRow = Record<string, unknown> & { id: string };
export type Where = Record<string, string | number | boolean | null>;

export interface ListOptions {
  where?: Where;
  orderBy?: { column: string; dir: "asc" | "desc" };
  limit?: number;
}

export interface Store {
  readonly kind: "demo" | "postgres";
  list<T extends Row>(table: TableName, opts?: ListOptions): Promise<T[]>;
  get<T extends Row>(table: TableName, id: string): Promise<T | null>;
  findOne<T extends Row>(table: TableName, where: Where): Promise<T | null>;
  insert<T extends Row>(table: TableName, row: T): Promise<T>;
  update<T extends Row>(table: TableName, id: string, patch: Partial<T>): Promise<T | null>;
  remove(table: TableName, id: string): Promise<void>;
  removeWhere(table: TableName, where: Where): Promise<void>;
  count(table: TableName, where?: Where): Promise<number>;
  putFile(file: StoredFile): Promise<void>;
  getFile(id: string): Promise<StoredFile | null>;
}

let instance: Promise<Store> | null = null;

export function getStore(): Promise<Store> {
  if (!instance) {
    if (isDemoMode() && process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_IN_PRODUCTION !== "true") {
      // Safety net: a production deploy without a database must not silently run on sample data.
      throw new Error("DATABASE_URL is missing. Set it (see README), or set ALLOW_DEMO_IN_PRODUCTION=true for a preview.");
    }
    instance = isDemoMode()
      ? import("./demo-store").then((m) => m.createDemoStore())
      : import("./pg-store").then((m) => m.createPostgresStore());
  }
  return instance;
}
