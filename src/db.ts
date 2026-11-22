import Dexie, { type Table } from 'dexie';
import type { Attachment, CustomShape, ImportJob, Song, Tuning } from './types';

export class SongBookDB extends Dexie {
  songs!: Table<Song, string>;
  tunings!: Table<Tuning, string>; // custom tunings only; built-ins live in code
  attachments!: Table<Attachment, string>;
  customShapes!: Table<CustomShape, string>;
  importJobs!: Table<ImportJob, string>;

  constructor(name = 'zerofs-songbook') {
    super(name);
    this.version(1).stores({
      songs: 'id, title, artist, key, *tags, lastPlayedAt, createdAt, updatedAt',
      tunings: 'id',
      attachments: 'id, songId, kind',
      customShapes: 'id, chordName, tuningId',
      importJobs: 'id, status, createdAt',
    });
  }
}

export const db = new SongBookDB();

/** Ask the browser not to evict our data (important on iOS). */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
