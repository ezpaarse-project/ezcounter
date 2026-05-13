import { describe, expect, test } from 'vitest';

import { formatPeriod, parsePeriod, splitPeriodByMonths } from './period';

describe('Parse period as dates (parsePeriod)', () => {
  test('should parse standard period', () => {
    const period = { end: '2025-12', start: '2025-01' };

    const result = parsePeriod(period);

    expect(result.start.toISOString()).toBe(new Date(2025, 0).toISOString());
    expect(result.end.toISOString()).toBe(new Date(2025, 11).toISOString());
  });

  test('should NOT parse invalid period', () => {
    const period = { end: '202512', start: '202501' };

    const result = parsePeriod(period);

    expect(() => result.start.toISOString()).toThrow('Invalid time value');
    expect(() => result.end.toISOString()).toThrow('Invalid time value');
  });
});

describe('Format dates as period (formatPeriod)', () => {
  test('should parse dates', () => {
    const period = { end: new Date(2025, 11), start: new Date(2025, 0) };

    const result = formatPeriod(period);

    expect(result.start).toBe('2025-01');
    expect(result.end).toBe('2025-12');
  });

  test('should NOT format invalid dates', () => {
    const period = { end: new Date('barfoo'), start: new Date('foobar') };

    const fnc = (): unknown => formatPeriod(period);

    expect(fnc).toThrow('Invalid time value');
  });
});

describe('Split period by months (splitPeriodByMonths)', () => {
  const period = { end: '2025-12', start: '2025-01' };

  test('should split by equal parts if possible', () => {
    const jobs = splitPeriodByMonths(period, 6);

    expect(jobs).toHaveLength(2);

    expect(jobs).toHaveProperty('0.start', '2025-01');
    expect(jobs).toHaveProperty('0.end', '2025-06');

    expect(jobs).toHaveProperty('1.start', '2025-07');
    expect(jobs).toHaveProperty('1.end', '2025-12');
  });

  test('should split with last part smaller if equal parts are not possible', () => {
    const jobs = splitPeriodByMonths(period, 5);

    expect(jobs).toHaveLength(3);

    expect(jobs).toHaveProperty('0.start', '2025-01');
    expect(jobs).toHaveProperty('0.end', '2025-05');

    expect(jobs).toHaveProperty('1.start', '2025-06');
    expect(jobs).toHaveProperty('1.end', '2025-10');

    expect(jobs).toHaveProperty('2.start', '2025-11');
    expect(jobs).toHaveProperty('2.end', '2025-12');
  });

  test('should be able to split by periods of 1 month', () => {
    const jobs = splitPeriodByMonths(period, 1);

    expect(jobs).toHaveLength(12);

    expect(jobs).toHaveProperty('0.start', '2025-01');
    expect(jobs).toHaveProperty('0.end', '2025-01');

    expect(jobs).toHaveProperty('6.start', '2025-07');
    expect(jobs).toHaveProperty('6.end', '2025-07');
  });

  test('should return the period if not split', () => {
    const jobs = splitPeriodByMonths(period, 0);

    expect(jobs).toHaveLength(1);

    expect(jobs).toHaveProperty('0.start', '2025-01');
    expect(jobs).toHaveProperty('0.end', '2025-12');
  });

  test('should throw if number of months is less than 0', () => {
    const fnc = (): unknown => splitPeriodByMonths(period, -1);

    expect(fnc).toThrow('monthsPerPart must be at least 0');
  });
});
