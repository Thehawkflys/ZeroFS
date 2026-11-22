import { describe, expect, it } from 'vitest';
import { parseLyricLine } from '../lib/chordpro';
import { buildItems } from './ChordSheet';

describe('buildItems', () => {
  it('groups chunks into unbreakable words', () => {
    const items = buildItems(parseLyricLine('[G]Here comes the [C]su[D]n'), 0, 'auto');
    const words = items.filter((i) => i.type === 'word');
    expect(words).toHaveLength(4);
    expect(words[3]).toEqual({ type: 'word', chunks: [{ chord: 'C', text: 'su' }, { chord: 'D', text: 'n' }] });
  });

  it('transposes chords as it goes', () => {
    const items = buildItems(parseLyricLine('[G]Hi'), 2, 'auto');
    expect(items[0]).toEqual({ type: 'word', chunks: [{ chord: 'A', text: 'Hi' }] });
  });

  it('keeps chords placed over spaces', () => {
    const items = buildItems(parseLyricLine('the [C] sun'), 0, 'auto');
    expect(items).toEqual([
      { type: 'word', chunks: [{ chord: undefined, text: 'the' }] },
      { type: 'space' },
      { type: 'word', chunks: [{ chord: 'C', text: '' }] },
      { type: 'space' },
      { type: 'word', chunks: [{ chord: undefined, text: 'sun' }] },
    ]);
  });
});
