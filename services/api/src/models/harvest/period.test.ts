import { describe, expect, it } from 'vitest';

import { formatPeriod, parsePeriod, splitPeriodByMonths } from './period';

describe('parse period as dates', () => {
  it('should parse standard period', () => {
    expect.hasAssertions();
    const period = { end: '2025-12', start: '2025-01' };

    const result = parsePeriod(period);

    expect(result.start.toISOString()).toBe(new Date(2025, 0).toISOString());
    expect(result.end.toISOString()).toBe(new Date(2025, 11).toISOString());
  });

  it('should NOT parse invalid period', () => {
    expect.hasAssertions();
    const period = { end: '202512', start: '202501' };

    const result = parsePeriod(period);

    expect(() => result.start.toISOString()).toThrow('Invalid time value');
    expect(() => result.end.toISOString()).toThrow('Invalid time value');
  });
});

describe('format dates as period', () => {
  it('should parse dates', () => {
    expect.hasAssertions();
    const period = { end: new Date(2025, 11), start: new Date(2025, 0) };

    const result = formatPeriod(period);

    expect(result.start).toBe('2025-01');
    expect(result.end).toBe('2025-12');
  });

  it('should NOT format invalid dates', () => {
    expect.hasAssertions();
    const period = { end: new Date('barfoo'), start: new Date('foobar') };

    const fnc = (): unknown => formatPeriod(period);

    expect(fnc).toThrow('Invalid time value');
  });
});

describe('split period by months', () => {
  const period = { end: '2025-12', start: '2025-01' };

  it('should split by equal parts if possible', () => {
    expect.hasAssertions();
    const jobs = splitPeriodByMonths(period, 6);

    expect(jobs).toHaveLength(2);

    expect(jobs[0]).toMatchObject({ end: '2025-06', start: '2025-01' });
    expect(jobs[1]).toMatchObject({ end: '2025-12', start: '2025-07' });
  });

  it('should split with last part smaller if equal parts are not possible', () => {
    expect.hasAssertions();
    const jobs = splitPeriodByMonths(period, 5);

    expect(jobs).toHaveLength(3);

    expect(jobs[0]).toMatchObject({ end: '2025-05', start: '2025-01' });
    expect(jobs[1]).toMatchObject({ end: '2025-10', start: '2025-06' });
    expect(jobs[2]).toMatchObject({ end: '2025-12', start: '2025-11' });
  });

  it('should be able to split by periods of 1 month', () => {
    expect.hasAssertions();
    const jobs = splitPeriodByMonths(period, 1);

    expect(jobs).toHaveLength(12);

    expect(jobs).toHaveProperty('0.start', '2025-01');
    expect(jobs).toHaveProperty('0.end', '2025-01');

    expect(jobs).toHaveProperty('6.start', '2025-07');
    expect(jobs).toHaveProperty('6.end', '2025-07');
  });

  it('should return the period if not split', () => {
    expect.hasAssertions();
    const jobs = splitPeriodByMonths(period, 0);

    expect(jobs).toHaveLength(1);

    expect(jobs).toHaveProperty('0.start', '2025-01');
    expect(jobs).toHaveProperty('0.end', '2025-12');
  });

  it('should throw if number of months is less than 0', () => {
    expect.hasAssertions();
    const fnc = (): unknown => splitPeriodByMonths(period, -1);

    expect(fnc).toThrow('monthsPerPart must be at least 0');
  });
});
