import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { db } from '../db';
import { ChordSheet } from '../components/ChordSheet';
import { TopBar } from '../components/TopBar';
import { parseChordPro } from '../lib/chordpro';
import { displayShift, soundingKey, spellingFor, transposeKey, type Accidentals } from '../lib/music';
import { usePref } from '../lib/prefs';
import { markPlayed, updateSong } from '../lib/songs';
import { findTuning } from '../lib/tunings';

const ACC_LABEL: Record<Accidentals, string> = { auto: 'Auto ♯/♭', sharps: '♯', flats: '♭' };
const NEXT_ACC: Record<Accidentals, Accidentals> = { auto: 'sharps', sharps: 'flats', flats: 'auto' };

function Stepper({ label, value, onChange, min, max, format }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  format?: (v: number) => string;
}) {
  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <button aria-label={`${label} down`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span className="stepper-value">{format ? format(value) : value}</span>
      <button aria-label={`${label} up`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

export function SongView() {
  const { id = '' } = useParams();
  const song = useLiveQuery(async () => (await db.songs.get(id)) ?? null, [id]);
  const customTunings = useLiveQuery(() => db.tunings.toArray(), []);
  const [fontSize, setFontSize] = usePref('fontSize', 18);
  const [showControls, setShowControls] = usePref('showControls', false);

  const counted = useRef<string | null>(null);
  useEffect(() => {
    if (id && counted.current !== id) {
      counted.current = id;
      void markPlayed(id);
    }
  }, [id]);

  const parsed = useMemo(() => (song ? parseChordPro(song.chordpro) : null), [song?.chordpro]);

  if (song === undefined) return <div className="page" />;
  if (song === null || !parsed) {
    return (
      <div className="page">
        <TopBar title="Not found" back="/" />
        <main className="content">
          <p>This song doesn't exist any more.</p>
        </main>
      </div>
    );
  }

  const shift = displayShift(song.transpose, song.writtenCapo, song.capo);
  const shapesKey = song.key ? transposeKey(song.key, shift) : undefined;
  const spelling = spellingFor(song.accidentals, shapesKey);
  const set = (changes: Parameters<typeof updateSong>[1]) => updateSong(song.id, changes);
  const tuning = findTuning(song.tuningId, customTunings ?? []);

  return (
    <div className="page">
      <TopBar title={song.title} back="/">
        <button
          className="icon-btn"
          aria-label="Transpose, capo and text size"
          aria-expanded={showControls}
          onClick={() => setShowControls(!showControls)}
        >
          <span className="icon-text">♯♭</span>
        </button>
        <button
          className="icon-btn"
          aria-label={song.favourite ? 'Remove from favourites' : 'Add to favourites'}
          aria-pressed={song.favourite}
          onClick={() => set({ favourite: !song.favourite })}
        >
          {song.favourite ? '★' : '☆'}
        </button>
        <Link className="icon-btn" to={`/song/${song.id}/edit`} aria-label="Edit">
          ✎
        </Link>
      </TopBar>

      <main className="content">
        <div className="song-meta">
          {song.artist && <div className="song-artist">{song.artist}</div>}
          <div className="meta-pills">
            {song.key && (
              <span className="pill">
                Key {soundingKey(song.key, song.transpose, song.writtenCapo, song.accidentals)}
                {song.capo > 0 && shapesKey && ` · ${transposeKey(shapesKey, 0, spelling)} shapes`}
              </span>
            )}
            {song.capo > 0 && <span className="pill">Capo {song.capo}</span>}
            {song.transpose !== 0 && (
              <span className="pill">Transposed {song.transpose > 0 ? `+${song.transpose}` : song.transpose}</span>
            )}
            {song.tempo && <span className="pill">{song.tempo} BPM</span>}
            {song.tuningId !== 'standard' && <span className="pill pill-warn">{tuning.name}</span>}
          </div>
        </div>

        {showControls && (
        <div className="controls">
          <Stepper
            label="Transpose"
            value={song.transpose}
            min={-11}
            max={11}
            onChange={(v) => set({ transpose: v })}
            format={(v) => (v > 0 ? `+${v}` : String(v))}
          />
          <Stepper label="Capo" value={song.capo} min={0} max={12} onChange={(v) => set({ capo: v })} />
          <div className="control-row">
            <button className="chip" onClick={() => set({ accidentals: NEXT_ACC[song.accidentals] })}>
              {ACC_LABEL[song.accidentals]}
            </button>
            <button className="chip" aria-label="Smaller text" onClick={() => setFontSize(Math.max(12, fontSize - 2))}>
              A−
            </button>
            <button className="chip" aria-label="Larger text" onClick={() => setFontSize(Math.min(40, fontSize + 2))}>
              A+
            </button>
            {(song.transpose !== 0 || song.capo !== song.writtenCapo) && (
              <button className="chip" onClick={() => set({ transpose: 0, capo: song.writtenCapo })}>
                Reset
              </button>
            )}
          </div>
        </div>
        )}

        <ChordSheet song={parsed} shift={shift} spelling={spelling} fontSize={fontSize} />

        {song.notes && (
          <div className="notes">
            <h2 className="list-heading">Notes</h2>
            <p>{song.notes}</p>
          </div>
        )}
      </main>
    </div>
  );
}
