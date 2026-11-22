import { Fragment, useMemo } from 'react';
import type { Line, ParsedSong, Segment } from '../lib/chordpro';
import { transposeChord } from '../lib/music';

type Spelling = 'sharps' | 'flats' | 'auto';

interface Chunk {
  chord?: string;
  text: string;
}
type Item = { type: 'word'; chunks: Chunk[] } | { type: 'space' };

/**
 * Split a lyric line into words made of chunks. Each chunk is a chord stacked over
 * the syllable it belongs to. A word can't break across lines, so its chords stay
 * aligned when the line wraps.
 */
export function buildItems(segments: Segment[], shift: number, spelling: Spelling): Item[] {
  const items: Item[] = [];
  let word: Chunk[] | null = null;
  const close = () => {
    if (word) items.push({ type: 'word', chunks: word });
    word = null;
  };
  for (const seg of segments) {
    const chord = seg.chord ? transposeChord(seg.chord, shift, spelling) : undefined;
    const pieces = seg.text.split(/(\s+)/).filter((p) => p !== '');
    let chordPending = chord;
    if (pieces.length === 0 || /^\s/.test(pieces[0])) {
      if (chordPending !== undefined) {
        (word ??= []).push({ chord: chordPending, text: '' });
        chordPending = undefined;
      }
    }
    for (const piece of pieces) {
      if (/^\s+$/.test(piece)) {
        close();
        items.push({ type: 'space' });
      } else {
        (word ??= []).push({ chord: chordPending, text: piece });
        chordPending = undefined;
      }
    }
  }
  close();
  return items;
}

function LyricLine({ segments, shift, spelling }: { segments: Segment[]; shift: number; spelling: Spelling }) {
  const items = useMemo(() => buildItems(segments, shift, spelling), [segments, shift, spelling]);
  const hasChords = segments.some((s) => s.chord);
  const hasText = segments.some((s) => s.text.trim());
  const cls = ['line', hasChords ? '' : 'no-chords', hasText ? '' : 'chords-only'].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      {items.map((item, i) =>
        item.type === 'space' ? (
          <Fragment key={i}> </Fragment>
        ) : (
          <span className="word" key={i}>
            {item.chunks.map((c, j) => {
              const midWord = j < item.chunks.length - 1;
              const wide = c.chord !== undefined && midWord && c.chord.length > c.text.length;
              return (
                <span className="chunk" key={j}>
                  <span className={c.chord ? 'chord' : 'chord chord-empty'}>{c.chord ?? ''}</span>
                  <span className={wide ? 'lyric hyphen' : 'lyric'}>{c.text || '\u00a0'}</span>
                </span>
              );
            })}
          </span>
        ),
      )}
    </div>
  );
}

function renderLine(line: Line, i: number, shift: number, spelling: Spelling) {
  switch (line.kind) {
    case 'empty':
      return <div className="line-gap" key={i} />;
    case 'comment':
      return (
        <div className={`comment comment-${line.style}`} key={i}>
          {line.text}
        </div>
      );
    case 'tab':
      return (
        <pre className="tab" key={i}>
          {line.text || ' '}
        </pre>
      );
    case 'lyrics':
      return <LyricLine key={i} segments={line.segments} shift={shift} spelling={spelling} />;
  }
}

const LABELS: Record<string, string> = { chorus: 'Chorus', verse: 'Verse', bridge: 'Bridge', tab: 'Tab', grid: 'Grid' };

export function ChordSheet({ song, shift, spelling, fontSize }: {
  song: ParsedSong;
  shift: number;
  spelling: Spelling;
  fontSize: number;
}) {
  return (
    <div className="sheet" style={{ fontSize: `${fontSize}px` }}>
      {song.sections.map((s, i) => (
        <section className={`section section-${s.kind}`} key={i}>
          {(s.label || (s.kind !== 'none' && s.kind !== 'verse')) && (
            <div className="section-label">{s.label ?? LABELS[s.kind]}</div>
          )}
          {s.lines.map((l, j) => renderLine(l, j, shift, spelling))}
        </section>
      ))}
    </div>
  );
}
