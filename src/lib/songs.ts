import { db, type SongBookDB } from '../db';
import type { Song } from '../types';
import { parseChordPro } from './chordpro';
import { STANDARD_ID } from './tunings';
import { SAMPLE_SONGS } from './samples';

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

export function blankSong(partial: Partial<Song> = {}): Song {
  const now = Date.now();
  return {
    id: uid(),
    title: '',
    chordpro: '',
    writtenCapo: 0,
    capo: 0,
    transpose: 0,
    accidentals: 'auto',
    tuningId: STANDARD_ID,
    tags: [],
    favourite: false,
    playCount: 0,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

/** Fill any empty fields from the ChordPro directives ({title}, {artist}, {key}, ...). */
export function fillFromChordPro(song: Song): Song {
  const { meta } = parseChordPro(song.chordpro);
  const out = { ...song };
  if (!out.title.trim() && meta.title) out.title = meta.title;
  if (!out.artist && (meta.artist || meta.subtitle)) out.artist = (meta.artist ?? meta.subtitle) as string;
  if (!out.key && meta.key) out.key = meta.key;
  if (!out.tempo && meta.tempo) out.tempo = meta.tempo;
  if (!out.durationSec && meta.duration) out.durationSec = meta.duration;
  if (!out.writtenCapo && meta.capo) {
    out.writtenCapo = meta.capo;
    out.capo = out.capo || meta.capo;
  }
  if (!out.title.trim()) out.title = 'Untitled';
  return out;
}

export async function saveSong(song: Song, database: SongBookDB = db): Promise<void> {
  await database.songs.put({ ...song, updatedAt: Date.now() });
}

export async function updateSong(id: string, changes: Partial<Song>, database: SongBookDB = db) {
  await database.songs.update(id, { ...changes, updatedAt: Date.now() });
}

export async function deleteSong(id: string, database: SongBookDB = db) {
  await database.transaction('rw', database.songs, database.attachments, async () => {
    await database.attachments.where('songId').equals(id).delete();
    await database.songs.delete(id);
  });
}

/** Called whenever a song is opened. */
export async function markPlayed(id: string, database: SongBookDB = db) {
  const song = await database.songs.get(id);
  if (!song) return;
  await database.songs.update(id, { lastPlayedAt: Date.now(), playCount: (song.playCount ?? 0) + 1 });
}

const SEED_FLAG = 'zerofs.seeded';

/** Add the sample songs the first time the app runs. */
export async function seedIfFirstRun(database: SongBookDB = db) {
  try {
    if (localStorage.getItem(SEED_FLAG)) return;
    localStorage.setItem(SEED_FLAG, '1');
  } catch {
    return;
  }
  if ((await database.songs.count()) > 0) return;
  for (const s of SAMPLE_SONGS) {
    await database.songs.put(fillFromChordPro(blankSong({ chordpro: s, source: { kind: 'typed' }, tags: ['sample'] })));
  }
}
