import type { Accidentals } from './lib/music';

export interface Song {
  id: string;
  title: string;
  artist?: string;
  /** ChordPro source: the single source of truth for the chord sheet. */
  chordpro: string;
  /** Key of the chords as written, e.g. "G" or "Em". */
  key?: string;
  /** Capo the written chords assume (from the source sheet). */
  writtenCapo: number;
  /** Capo you are actually playing with; changes the chord shapes shown. */
  capo: number;
  /** Semitones to move the song by. */
  transpose: number;
  accidentals: Accidentals;
  tempo?: number;
  durationSec?: number;
  tuningId: string;
  tags: string[];
  notes?: string;
  favourite: boolean;
  scrollSpeed?: number;
  playCount: number;
  lastPlayedAt?: number;
  createdAt: number;
  updatedAt: number;
  source?: { kind: 'typed' | 'paste' | 'file' | 'url' | 'ai'; ref?: string };
}

export interface Tuning {
  id: string;
  name: string;
  /** Low string to high string, scientific pitch, e.g. ["D2","A2","D3","G3","B3","E4"]. */
  strings: string[];
  builtIn: boolean;
}

export type AttachmentKind = 'guitarpro' | 'musicxml' | 'pdf' | 'image' | 'audio';

export interface Attachment {
  id: string;
  songId: string;
  kind: AttachmentKind;
  name: string;
  mime: string;
  blob: Blob;
  createdAt: number;
}

export interface CustomShape {
  id: string;
  chordName: string;
  tuningId: string;
  /** Low string to high string. */
  frets: (number | 'x')[];
  fingers?: number[];
  baseFret: number;
  barres?: number[];
  createdAt: number;
}

export interface ImportJob {
  id: string;
  input: { kind: 'url' | 'pdf' | 'image' | 'text'; data: string | Blob; name?: string };
  status: 'queued' | 'running' | 'done' | 'error';
  resultSongId?: string;
  error?: string;
  createdAt: number;
}
