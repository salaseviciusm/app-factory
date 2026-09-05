import type { BaseEvent, EventStore } from '@factory/core';
import type { SQLiteDatabase } from 'expo-sqlite';

/**
 * Append-only log on expo-sqlite's synchronous API. The whole log is held in memory
 * after the first read: projections re-fold it on every render, and parsing JSON
 * thousands of times per frame is not the kind of honest we mean.
 */
export class SqliteEventStore<E extends BaseEvent = BaseEvent> implements EventStore<E> {
  private cache: E[] | undefined;

  constructor(private readonly db: SQLiteDatabase) {
    db.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS events (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        id TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        payload TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS events_type ON events(type);
    `);
  }

  append(events: readonly E[]): void {
    if (events.length === 0) {
      return;
    }
    this.db.withTransactionSync(() => {
      for (const event of events) {
        this.db.runSync(
          'INSERT INTO events (id, type, timestamp, payload) VALUES (?, ?, ?, ?)',
          event.id,
          event.type,
          event.timestamp,
          JSON.stringify(event),
        );
      }
    });
    if (this.cache) {
      this.cache.push(...events);
    }
  }

  read(range?: { from?: number; to?: number }): readonly E[] {
    const all = this.load();
    if (!range) {
      return [...all];
    }
    const from = range.from ?? 0;
    const to = range.to ?? Number.MAX_SAFE_INTEGER;
    return all.filter((e) => e.timestamp >= from && e.timestamp <= to);
  }

  /** Physically deletes everything. Only "Erase all data" in settings calls this. */
  wipe(): void {
    this.db.execSync('DELETE FROM events');
    this.cache = [];
  }

  private load(): E[] {
    if (!this.cache) {
      const rows = this.db.getAllSync<{ payload: string }>(
        'SELECT payload FROM events ORDER BY seq',
      );
      this.cache = rows.map((row) => JSON.parse(row.payload) as E);
    }
    return this.cache;
  }
}
