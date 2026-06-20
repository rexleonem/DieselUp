import { describe, expect, it } from 'vitest';
import { formatLitres, formatNaira, initials } from '../src/lib/format';

describe('display formatting', () => {
  it('formats litres with Nigerian grouping', () => expect(formatLitres(1250)).toBe('1,250 L'));
  it('formats NGN without fractional kobo', () => expect(formatNaira(1250)).toMatch(/1,250/));
  it('produces stable two-letter initials', () => expect(initials('Ada Diesel')).toBe('AD'));
});
