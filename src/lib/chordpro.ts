// A ChordPro parser covering the directives used in everyday chord sheets.
// Spec: https://www.chordpro.org/chordpro/chordpro-directives/

export interface Segment {
  chord?: string;
  text: string;
}

export type Line =
  | { kind: 'lyrics'; segments: Segment[] }
  | { kind: 'comment'; text: string; style: 'normal' | 'italic' | 'box' }
  | { kind: 'empty' }
  | { kind: 'tab'; text: string };

export type SectionKind = 'none' | 'verse' | 'chorus' | 'bridge' | 'tab' | 'grid';

export interface Section {
  kind: SectionKind;
  label?: string;
  lines: Line[];
}

export interface SongMeta {
  title?: string;
  subtitle?: string;
  artist?: string;
  key?: string;
  capo?: number;
  tempo?: number;
  time?: string;
  duration?: number; // seconds
  [extra: string]: string | number | undefined;
}

export interface ParsedSong {
  meta: SongMeta;
  sections: Section[];
}

const ALIASES: Record<string, string> = {
  t: 'title', st: 'subtitle', su: 'subtitle',
  c: 'comment', ci: 'comment_italic', cb: 'comment_box',
  soc: 'start_of_chorus', eoc: 'end_of_chorus',
  sov: 'start_of_verse', eov: 'end_of_verse',
  sob: 'start_of_bridge', eob: 'end_of_bridge',
  sot: 'start_of_tab', eot: 'end_of_tab',
  sog: 'start_of_grid', eog: 'end_of_grid',
};

const START_SECTIONS: Record<string, SectionKind> = {
  start_of_chorus: 'chorus', start_of_verse: 'verse', start_of_bridge: 'bridge',
  start_of_tab: 'tab', start_of_grid: 'grid',
};
const END_SECTIONS = new Set(['end_of_chorus', 'end_of_verse', 'end_of_bridge', 'end_of_tab', 'end_of_grid']);

const DIRECTIVE_RE = /^\{\s*([a-zA-Z_]+)(?:[\s:]\s*(.*?))?\s*\}$/;
const CHORD_TOKEN_RE = /\[([^\]]*)\]/g;

/** Parse "3:45" or "225" into seconds. */
export function parseDuration(v: string): number | undefined {
  const parts = v.trim().split(':').map(Number);
  if (parts.some((p) => !Number.isFinite(p))) return undefined;
  return parts.reduce((acc, p) => acc * 60 + p, 0) || undefined;
}

export function parseLyricLine(line: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  let pendingChord: string | undefined;
  for (const m of line.matchAll(CHORD_TOKEN_RE)) {
    const text = line.slice(last, m.index);
    if (pendingChord !== undefined || text) segments.push({ chord: pendingChord, text });
    pendingChord = m[1].trim();
    last = m.index! + m[0].length;
  }
  const tail = line.slice(last);
  if (pendingChord !== undefined || tail) segments.push({ chord: pendingChord, text: tail });
  return segments;
}

export function parseChordPro(source: string): ParsedSong {
  const meta: SongMeta = {};
  const sections: Section[] = [];
  let current: Section = { kind: 'none', lines: [] };
  const push = () => {
    if (current.lines.length || current.kind !== 'none') sections.push(current);
  };

  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.replace(/\s+$/, '');

    // Inside tab/grid blocks, keep text verbatim (monospace).
    if ((current.kind === 'tab' || current.kind === 'grid') && !DIRECTIVE_RE.test(line.trim())) {
      current.lines.push({ kind: 'tab', text: line });
      continue;
    }

    if (line.trim().startsWith('#')) continue; // ChordPro comment line

    const d = DIRECTIVE_RE.exec(line.trim());
    if (d) {
      const name = ALIASES[d[1].toLowerCase()] ?? d[1].toLowerCase();
      const value = (d[2] ?? '').trim();
      if (START_SECTIONS[name]) {
        push();
        current = { kind: START_SECTIONS[name], label: value || undefined, lines: [] };
      } else if (END_SECTIONS.has(name)) {
        push();
        current = { kind: 'none', lines: [] };
      } else if (name === 'comment' || name === 'comment_italic' || name === 'comment_box' || name === 'highlight') {
        const style = name === 'comment_italic' ? 'italic' : name === 'comment_box' ? 'box' : 'normal';
        current.lines.push({ kind: 'comment', text: value, style });
      } else if (name === 'chorus') {
        current.lines.push({ kind: 'comment', text: value || 'Chorus', style: 'box' });
      } else if (name === 'capo' || name === 'tempo') {
        const n = parseInt(value, 10);
        if (Number.isFinite(n)) meta[name] = n;
      } else if (name === 'duration') {
        meta.duration = parseDuration(value);
      } else if (name === 'meta') {
        const [k, ...rest] = value.split(/\s+/);
        if (k) meta[k.toLowerCase()] = rest.join(' ');
      } else if (value) {
        meta[name] = value;
      }
      continue;
    }

    if (!line.trim()) {
      current.lines.push({ kind: 'empty' });
    } else {
      current.lines.push({ kind: 'lyrics', segments: parseLyricLine(line) });
    }
  }
  push();

  // Trim leading/trailing empty lines in each section, and drop empty untitled sections.
  const cleaned = sections
    .map((s) => {
      const lines = [...s.lines];
      while (lines[0]?.kind === 'empty') lines.shift();
      while (lines[lines.length - 1]?.kind === 'empty') lines.pop();
      return { ...s, lines };
    })
    .filter((s) => s.lines.length || s.label);

  return { meta, sections: cleaned };
}

/** Every distinct chord used, in order of first appearance. */
export function chordsUsed(song: ParsedSong): string[] {
  const seen = new Set<string>();
  for (const s of song.sections)
    for (const l of s.lines)
      if (l.kind === 'lyrics') for (const seg of l.segments) if (seg.chord) seen.add(seg.chord);
  return [...seen];
}

/** Plain lyric text (for search). */
export function lyricsText(song: ParsedSong): string {
  return song.sections
    .flatMap((s) => s.lines)
    .map((l) => (l.kind === 'lyrics' ? l.segments.map((s) => s.text).join('') : ''))
    .filter(Boolean)
    .join('\n');
}
