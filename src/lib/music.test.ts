import { describe, expect, it } from 'vitest';
import { displayShift, noteToPc, parseChord, soundingKey, spellingFor, transposeChord } from './music';

describe('notes and chords', () => {
  it('parses note names', () => {
    expect(noteToPc('C')).toBe(0);
    expect(noteToPc('F#')).toBe(6);
    expect(noteToPc('Gb')).toBe(6);
    expect(noteToPc('B#')).toBe(0);
    expect(noteToPc('H')).toBeNull();
  });

  it('parses chord symbols', () => {
    expect(parseChord('Am7/G')).toEqual({ root: 9, quality: 'm7', bass: 7 });
    expect(parseChord('C7b9')).toEqual({ root: 0, quality: '7b9', bass: undefined });
    expect(parseChord('N.C.')).toBeNull();
    expect(parseChord('x2')).toBeNull();
  });

  it('transposes chords', () => {
    expect(transposeChord('G', 2)).toBe('A');
    expect(transposeChord('Em7', 3)).toBe('Gm7');
    expect(transposeChord('D/F#', -2)).toBe('C/E');
    expect(transposeChord('A', 1, 'flats')).toBe('Bb');
    expect(transposeChord('A', 1, 'sharps')).toBe('A#');
    expect(transposeChord('Cmaj7', 12)).toBe('Cmaj7');
    expect(transposeChord('N.C.', 5)).toBe('N.C.');
  });

  it('picks spelling from the key', () => {
    expect(spellingFor('auto', 'F')).toBe('flats');
    expect(spellingFor('auto', 'E')).toBe('sharps');
    expect(spellingFor('auto', 'Dm')).toBe('flats');
    expect(spellingFor('auto', 'C')).toBe('auto');
    expect(spellingFor('sharps', 'F')).toBe('sharps');
  });

  it('capo moves the shapes down, keeping the sounding key', () => {
    // Written in G with no capo; player puts capo on 2 → plays F shapes.
    expect(displayShift(0, 0, 2)).toBe(-2);
    expect(transposeChord('G', displayShift(0, 0, 2))).toBe('F');
    // Sheet written as C shapes with capo 3; player takes capo off → Eb chords.
    expect(transposeChord('C', displayShift(0, 3, 0), 'flats')).toBe('Eb');
    expect(soundingKey('C', 0, 3, 'auto')).toBe('Eb');
  });
});
