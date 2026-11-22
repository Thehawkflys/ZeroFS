import { db, type SongBookDB } from '../db';
import type { Attachment, CustomShape, Song, Tuning } from '../types';

export interface BackupFile {
  app: 'zerofs-songbook';
  version: 1;
  exportedAt: string;
  songs: Song[];
  tunings: Tuning[];
  customShapes: CustomShape[];
  attachments: (Omit<Attachment, 'blob'> & { data: string })[];
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

function base64ToBlob(b64: string, mime: string): Blob {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export async function exportBackup(database: SongBookDB = db): Promise<BackupFile> {
  const [songs, tunings, customShapes, attachments] = await Promise.all([
    database.songs.toArray(),
    database.tunings.toArray(),
    database.customShapes.toArray(),
    database.attachments.toArray(),
  ]);
  return {
    app: 'zerofs-songbook',
    version: 1,
    exportedAt: new Date().toISOString(),
    songs,
    tunings,
    customShapes,
    attachments: await Promise.all(
      attachments.map(async ({ blob, ...rest }) => ({ ...rest, data: await blobToBase64(blob) })),
    ),
  };
}

export interface ImportResult {
  added: number;
  updated: number;
  skipped: number;
}

/** Merge a backup into the library. Where both copies exist, the newer one wins. */
export async function importBackup(file: unknown, database: SongBookDB = db): Promise<ImportResult> {
  const b = file as BackupFile;
  if (!b || b.app !== 'zerofs-songbook' || !Array.isArray(b.songs)) {
    throw new Error('This file is not a Song Book backup.');
  }
  const result: ImportResult = { added: 0, updated: 0, skipped: 0 };
  await database.transaction('rw', [database.songs, database.tunings, database.customShapes, database.attachments], async () => {
    for (const song of b.songs) {
      const existing = await database.songs.get(song.id);
      if (!existing) result.added++;
      else if (existing.updatedAt < song.updatedAt) result.updated++;
      else {
        result.skipped++;
        continue;
      }
      await database.songs.put(song);
    }
    if (b.tunings?.length) await database.tunings.bulkPut(b.tunings);
    if (b.customShapes?.length) await database.customShapes.bulkPut(b.customShapes);
    for (const { data, ...a } of b.attachments ?? []) {
      if (!(await database.attachments.get(a.id))) {
        await database.attachments.put({ ...a, blob: base64ToBlob(data, a.mime) });
      }
    }
  });
  return result;
}

/** Save the backup: use the iOS share sheet (Save to Files) when available, otherwise download. */
export async function saveBackupFile(backup: BackupFile): Promise<void> {
  const stamp = backup.exportedAt.slice(0, 10);
  const name = `songbook-backup-${stamp}.json`;
  const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Song Book backup' });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      // fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
