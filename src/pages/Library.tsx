import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { TopBar } from '../components/TopBar';
import type { Song } from '../types';

function SongRow({ song }: { song: Song }) {
  return (
    <li>
      <Link className="song-row" to={`/song/${song.id}`}>
        <span className="song-row-main">
          <span className="song-row-title">
            {song.favourite && <span aria-label="Favourite">★ </span>}
            {song.title}
          </span>
          {song.artist && <span className="song-row-artist">{song.artist}</span>}
        </span>
        {song.key && <span className="pill">{song.key}</span>}
      </Link>
    </li>
  );
}

export function Library() {
  const songs = useLiveQuery(() => db.songs.orderBy('title').toArray(), []);
  const [q, setQ] = useState('');

  // Simple filter for now; fuzzy search (Fuse.js) arrives in the search stage.
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!songs) return [];
    if (!needle) return songs;
    return songs.filter((s) =>
      [s.title, s.artist, s.key, s.tags.join(' '), s.chordpro].some((f) => f?.toLowerCase().includes(needle)),
    );
  }, [songs, q]);

  const recent = useMemo(
    () =>
      (songs ?? [])
        .filter((s) => s.lastPlayedAt)
        .sort((a, b) => (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0))
        .slice(0, 5),
    [songs],
  );

  return (
    <div className="page">
      <TopBar title="Song Book">
        <Link className="icon-btn" to="/settings" aria-label="Settings">
          ⚙
        </Link>
      </TopBar>
      <main className="content">
        <input
          className="search"
          type="search"
          placeholder="Search songs, artists, lyrics…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {!q && recent.length > 0 && (
          <>
            <h2 className="list-heading">Recently played</h2>
            <ul className="song-list">
              {recent.map((s) => (
                <SongRow key={s.id} song={s} />
              ))}
            </ul>
          </>
        )}
        <h2 className="list-heading">{q ? `Results (${filtered.length})` : `All songs (${songs?.length ?? 0})`}</h2>
        <ul className="song-list">
          {filtered.map((s) => (
            <SongRow key={s.id} song={s} />
          ))}
        </ul>
        {songs && songs.length === 0 && <p className="muted">No songs yet. Tap + to add one.</p>}
      </main>
      <Link className="fab" to="/new" aria-label="Add song">
        +
      </Link>
    </div>
  );
}
