// Note names, chord parsing, transposition and sharp/flat spelling.

export type Accidentals = 'auto' | 'sharps' | 'flats';
type Spelling = 'sharps' | 'flats' | 'auto';

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
// The spelling guitarists usually see when no key signature applies.
const AUTO_NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const NOTE = '[A-G](?:##|bb|#|b|♯|♭)?';
const CHORD_RE = new RegExp(`^(${NOTE})([^/]*)(?:/(${NOTE}))?$`);

export const mod12 = (n: number) => ((n % 12) + 12) % 12;

/** Pitch class (0–11) of a note name like "F#", "Bb", "E". */
export function noteToPc(note: string): number | null {
  const m = /^([A-G])(##|bb|#|b|♯|♭)?$/.exec(note.trim());
  if (!m) return null;
  let pc = LETTER_PC[m[1]];
  switch (m[2]) {
    case '#': case '♯': pc += 1; break;
    case 'b': case '♭': pc -= 1; break;
    case '##': pc += 2; break;
    case 'bb': pc -= 2; break;
  }
  return mod12(pc);
}

export function pcToNote(pc: number, spelling: Spelling = 'auto'): string {
  const table = spelling === 'sharps' ? SHARP_NAMES : spelling === 'flats' ? FLAT_NAMES : AUTO_NAMES;
  return table[mod12(pc)];
}

export interface ParsedChord {
  root: number;
  quality: string; // everything between root and slash, e.g. "m7", "sus4", "maj7"
  bass?: number;
}

/** Parse a chord symbol. Returns null for things that aren't chords (e.g. "N.C.", "x2"). */
export function parseChord(symbol: string): ParsedChord | null {
  const m = CHORD_RE.exec(symbol.trim());
  if (!m) return null;
  const quality = m[2];
  // Reject obvious non-chords: qualities should only contain chord-ish characters.
  if (!/^[a-zA-Z0-9#b♯♭+\-()°ø△^,.]*$/.test(quality)) return null;
  const root = noteToPc(m[1]);
  if (root === null) return null;
  const bass = m[3] ? noteToPc(m[3]) : undefined;
  return { root, quality, bass: bass ?? undefined };
}

export function isMinorQuality(quality: string): boolean {
  return /^m(?!aj)/.test(quality) || quality.startsWith('-');
}

// Keys whose signature uses flats.
const FLAT_MAJOR = new Set([5, 10, 3, 8, 1]); // F Bb Eb Ab Db
const FLAT_MINOR = new Set([2, 7, 0, 5, 10, 3]); // Dm Gm Cm Fm Bbm Ebm
const SHARP_MAJOR = new Set([7, 2, 9, 4, 11, 6]); // G D A E B F#
const SHARP_MINOR = new Set([4, 11, 6, 1, 8]); // Em Bm F#m C#m G#m

/** Work out which spelling to use for a given (already transposed) key. */
export function spellingFor(accidentals: Accidentals, key?: string): Spelling {
  if (accidentals !== 'auto') return accidentals;
  if (!key) return 'auto';
  const k = parseChord(key);
  if (!k) return 'auto';
  const minor = isMinorQuality(k.quality);
  if (minor ? FLAT_MINOR.has(k.root) : FLAT_MAJOR.has(k.root)) return 'flats';
  if (minor ? SHARP_MINOR.has(k.root) : SHARP_MAJOR.has(k.root)) return 'sharps';
  return 'auto';
}

/** Transpose a chord symbol by n semitones. Unparseable symbols are returned unchanged. */
export function transposeChord(symbol: string, semitones: number, spelling: Spelling = 'auto'): string {
  const c = parseChord(symbol);
  if (!c) return symbol;
  const root = pcToNote(c.root + semitones, spelling);
  const bass = c.bass !== undefined ? '/' + pcToNote(c.bass + semitones, spelling) : '';
  return root + c.quality + bass;
}

/** Transpose a key like "G" or "Em". */
export function transposeKey(key: string, semitones: number, spelling: Spelling = 'auto'): string {
  return transposeChord(key, semitones, spelling);
}

export const ALL_KEYS = [
  'C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Ebm', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'Bbm', 'Bm',
];

/**
 * How far the chords shown differ from the chords as written.
 *  - transpose: semitones the player wants to move the song by
 *  - writtenCapo: the capo the source sheet's chords assume
 *  - capo: the capo the player is actually using
 * Raising the capo by one means the shapes shown go down by one, so the song
 * still sounds in the same key.
 */
export function displayShift(transpose: number, writtenCapo: number, capo: number): number {
  return transpose + writtenCapo - capo;
}

/** The key the song actually sounds in. */
export function soundingKey(key: string, transpose: number, writtenCapo: number, accidentals: Accidentals): string {
  const shift = transpose + writtenCapo;
  const sp = spellingFor(accidentals, transposeKey(key, shift));
  return transposeKey(key, shift, sp);
}
