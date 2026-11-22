import type { Tuning } from '../types';

export const STANDARD_ID = 'standard';

export const BUILT_IN_TUNINGS: Tuning[] = [
  { id: STANDARD_ID, name: 'Standard (EADGBE)', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'], builtIn: true },
  { id: 'eb-standard', name: 'E♭ standard (half step down)', strings: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'], builtIn: true },
  { id: 'd-standard', name: 'D standard (whole step down)', strings: ['D2', 'G2', 'C3', 'F3', 'A3', 'D4'], builtIn: true },
  { id: 'drop-d', name: 'Drop D (DADGBE)', strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'], builtIn: true },
  { id: 'drop-c', name: 'Drop C (CGCFAD)', strings: ['C2', 'G2', 'C3', 'F3', 'A3', 'D4'], builtIn: true },
  { id: 'double-drop-d', name: 'Double drop D (DADGBD)', strings: ['D2', 'A2', 'D3', 'G3', 'B3', 'D4'], builtIn: true },
  { id: 'dadgad', name: 'DADGAD', strings: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'], builtIn: true },
  { id: 'open-g', name: 'Open G (DGDGBD)', strings: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'], builtIn: true },
  { id: 'open-d', name: 'Open D (DADF#AD)', strings: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'], builtIn: true },
  { id: 'open-e', name: 'Open E (EBEG#BE)', strings: ['E2', 'B2', 'E3', 'G#3', 'B3', 'E4'], builtIn: true },
  { id: 'open-c', name: 'Open C (CGCGCE)', strings: ['C2', 'G2', 'C3', 'G3', 'C4', 'E4'], builtIn: true },
];

export function findTuning(id: string, custom: Tuning[] = []): Tuning {
  return [...BUILT_IN_TUNINGS, ...custom].find((t) => t.id === id) ?? BUILT_IN_TUNINGS[0];
}
