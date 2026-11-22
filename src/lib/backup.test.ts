import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { SongBookDB } from '../db';
import { exportBackup, importBackup } from './backup';
import { blankSong } from './songs';

describe('backup', () => {
  it('round-trips songs and keeps the newer copy', async () => {
    const a = new SongBookDB('test-a');
    const b = new SongBookDB('test-b');
    const song = blankSong({ title: 'One', chordpro: '[G]Hi', updatedAt: 100 });
    await a.songs.put(song);
    await b.songs.put({ ...song, title: 'One (newer)', updatedAt: 200 });
    await b.songs.put(blankSong({ title: 'Other' }));

    const backup = await exportBackup(a);
    const json = JSON.parse(JSON.stringify(backup));
    const r1 = await importBackup(json, b);
    expect(r1).toEqual({ added: 0, updated: 0, skipped: 1 });
    expect((await b.songs.get(song.id))?.title).toBe('One (newer)');

    const c = new SongBookDB('test-c');
    const r2 = await importBackup(json, c);
    expect(r2.added).toBe(1);
    expect((await c.songs.get(song.id))?.chordpro).toBe('[G]Hi');
  });

  it('rejects other files', async () => {
    await expect(importBackup({ foo: 1 }, new SongBookDB('test-d'))).rejects.toThrow();
  });
});
