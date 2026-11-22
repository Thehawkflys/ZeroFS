import { describe, expect, it } from 'vitest';
import { chordsUsed, parseChordPro, parseLyricLine } from './chordpro';

describe('parseLyricLine', () => {
  it('splits chords and lyrics', () => {
    expect(parseLyricLine('[G]Here comes the [C]sun')).toEqual([
      { chord: 'G', text: 'Here comes the ' },
      { chord: 'C', text: 'sun' },
    ]);
  });
  it('keeps text before the first chord', () => {
    expect(parseLyricLine('A[G]mazing')).toEqual([
      { chord: undefined, text: 'A' },
      { chord: 'G', text: 'mazing' },
    ]);
  });
  it('handles chord-only lines and trailing chords', () => {
    expect(parseLyricLine('[G] [C] [D]')).toEqual([
      { chord: 'G', text: ' ' },
      { chord: 'C', text: ' ' },
      { chord: 'D', text: '' },
    ]);
  });
});

describe('parseChordPro', () => {
  const src = `{title: Test Song}
{artist: Someone}
{key: G}
{capo: 2}
{tempo: 96}
{duration: 3:15}
# a comment line

[G]Verse line

{soc}
[C]Chorus [D]line
{eoc}
{c: Repeat twice}
{sot}
e|---0---|
{eot}`;

  it('reads metadata', () => {
    const { meta } = parseChordPro(src);
    expect(meta).toMatchObject({ title: 'Test Song', artist: 'Someone', key: 'G', capo: 2, tempo: 96, duration: 195 });
  });

  it('builds sections', () => {
    const { sections } = parseChordPro(src);
    expect(sections.map((s) => s.kind)).toEqual(['none', 'chorus', 'none', 'tab']);
    expect(sections[1].lines).toHaveLength(1);
    expect(sections[2].lines[0]).toEqual({ kind: 'comment', text: 'Repeat twice', style: 'normal' });
    expect(sections[3].lines[0]).toEqual({ kind: 'tab', text: 'e|---0---|' });
  });

  it('lists chords used', () => {
    expect(chordsUsed(parseChordPro(src))).toEqual(['G', 'C', 'D']);
  });
});
