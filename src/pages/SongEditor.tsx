import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../db';
import { ChordSheet } from '../components/ChordSheet';
import { TopBar } from '../components/TopBar';
import { parseChordPro } from '../lib/chordpro';
import { ALL_KEYS } from '../lib/music';
import { blankSong, deleteSong, fillFromChordPro, saveSong } from '../lib/songs';
import { BUILT_IN_TUNINGS } from '../lib/tunings';
import type { Song } from '../types';

const PLACEHOLDER = `{title: Song title}
{artist: Artist}
{key: G}

{start_of_verse: Verse 1}
[G]Here comes the [C]sun
{end_of_verse}`;

function formatDuration(sec?: number) {
  if (!sec) return '';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}
function parseDurationInput(v: string): number | undefined {
  const m = /^(\d+)(?::(\d{1,2}))?$/.exec(v.trim());
  if (!m) return undefined;
  return m[2] !== undefined ? Number(m[1]) * 60 + Number(m[2]) : Number(m[1]);
}

export function SongEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = useLiveQuery(async () => (id ? ((await db.songs.get(id)) ?? null) : null), [id]);
  const customTunings = useLiveQuery(() => db.tunings.toArray(), []);
  const [draft, setDraft] = useState<Song | null>(null);
  const [tagsText, setTagsText] = useState('');
  const [durationText, setDurationText] = useState('');
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (draft) return;
    if (!id) {
      setDraft(blankSong({ source: { kind: 'typed' } }));
    } else if (existing) {
      setDraft(existing);
      setTagsText(existing.tags.join(', '));
      setDurationText(formatDuration(existing.durationSec));
    }
  }, [id, existing, draft]);

  const parsed = useMemo(() => (draft && preview ? parseChordPro(draft.chordpro) : null), [draft, preview]);

  if (id && existing === null) {
    return (
      <div className="page">
        <TopBar title="Not found" back="/" />
      </div>
    );
  }
  if (!draft) return <div className="page" />;

  const set = <K extends keyof Song>(k: K, v: Song[K]) => setDraft({ ...draft, [k]: v });

  const save = async () => {
    const song = fillFromChordPro({
      ...draft,
      title: draft.title.trim(),
      artist: draft.artist?.trim() || undefined,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
      durationSec: parseDurationInput(durationText),
    });
    await saveSong(song);
    navigate(`/song/${song.id}`, { replace: true });
  };

  const remove = async () => {
    if (!confirm(`Delete "${draft.title || 'this song'}"? This can't be undone.`)) return;
    await deleteSong(draft.id);
    navigate('/', { replace: true });
  };

  const tunings = [...BUILT_IN_TUNINGS, ...(customTunings ?? [])];

  return (
    <div className="page">
      <TopBar title={id ? 'Edit song' : 'New song'} back={id ? `/song/${id}` : '/'}>
        <button className="btn-primary" onClick={save}>
          Save
        </button>
      </TopBar>
      <main className="content form">
        <label>
          Title
          <input value={draft.title} onChange={(e) => set('title', e.target.value)} placeholder="From {title} if blank" />
        </label>
        <label>
          Artist
          <input value={draft.artist ?? ''} onChange={(e) => set('artist', e.target.value)} />
        </label>
        <div className="form-row">
          <label>
            Key
            <select value={draft.key ?? ''} onChange={(e) => set('key', e.target.value || undefined)}>
              <option value="">—</option>
              {ALL_KEYS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <label>
            Capo (as written)
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={12}
              value={draft.writtenCapo}
              onChange={(e) => {
                const v = Math.max(0, Math.min(12, Number(e.target.value) || 0));
                setDraft({ ...draft, writtenCapo: v, capo: draft.capo === draft.writtenCapo ? v : draft.capo });
              }}
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Tempo (BPM)
            <input
              type="number"
              inputMode="numeric"
              value={draft.tempo ?? ''}
              onChange={(e) => set('tempo', e.target.value ? Number(e.target.value) : undefined)}
            />
          </label>
          <label>
            Length (m:ss)
            <input inputMode="numeric" value={durationText} onChange={(e) => setDurationText(e.target.value)} placeholder="3:30" />
          </label>
        </div>
        <label>
          Tuning
          <select value={draft.tuningId} onChange={(e) => set('tuningId', e.target.value)}>
            {tunings.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tags (comma separated)
          <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="folk, fingerstyle" />
        </label>

        <div className="editor-head">
          <span>Chord sheet (ChordPro)</span>
          <button className="chip" onClick={() => setPreview(!preview)}>
            {preview ? 'Edit' : 'Preview'}
          </button>
        </div>
        {preview && parsed ? (
          <div className="preview">
            <ChordSheet song={parsed} shift={0} spelling="auto" fontSize={16} />
          </div>
        ) : (
          <textarea
            className="chordpro-input"
            value={draft.chordpro}
            onChange={(e) => set('chordpro', e.target.value)}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        )}
        <p className="hint">
          Put chords in square brackets right before the syllable: <code>[G]Here comes the [C]sun</code>. Sections:{' '}
          <code>{'{soc}'}</code> … <code>{'{eoc}'}</code> for a chorus, <code>{'{c: text}'}</code> for a note.
        </p>

        <label>
          Notes
          <textarea className="notes-input" value={draft.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
        </label>

        {id && (
          <button className="btn-danger" onClick={remove}>
            Delete song
          </button>
        )}
      </main>
    </div>
  );
}
