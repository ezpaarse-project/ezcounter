import { describe, expect, test } from 'vitest';

import { splitPeriodByMonths } from '.';

describe('Split period by months (splitPeriodByMonths)', () => {
  test('should split by equal parts if possible', () => {
    const result = splitPeriodByMonths(
      {
        start: '2025-01',
        end: '2025-12',
      },
      6
    );

    expect(result).toHaveLength(2);

    expect(result).toHaveProperty('0.start', '2025-01');
    expect(result).toHaveProperty('0.end', '2025-06');

    expect(result).toHaveProperty('1.start', '2025-07');
    expect(result).toHaveProperty('1.end', '2025-12');
  });

  test('should split with last part smaller if equal parts are not possible', () => {
    const result = splitPeriodByMonths(
      {
        start: '2025-01',
        end: '2025-12',
      },
      5
    );

    expect(result).toHaveLength(3);

    expect(result).toHaveProperty('0.start', '2025-01');
    expect(result).toHaveProperty('0.end', '2025-05');

    expect(result).toHaveProperty('1.start', '2025-06');
    expect(result).toHaveProperty('1.end', '2025-10');

    expect(result).toHaveProperty('2.start', '2025-11');
    expect(result).toHaveProperty('2.end', '2025-12');
  });

  test('should be able to split by periods of 1 month', () => {
    const result = splitPeriodByMonths(
      {
        start: '2025-01',
        end: '2025-12',
      },
      1
    );

    expect(result).toHaveLength(12);

    expect(result).toHaveProperty('0.start', '2025-01');
    expect(result).toHaveProperty('0.end', '2025-01');

    expect(result).toHaveProperty('6.start', '2025-07');
    expect(result).toHaveProperty('6.end', '2025-07');
  });

  test('should return the period if split by 0', () => {
    const result = splitPeriodByMonths(
      {
        start: '2025-01',
        end: '2025-12',
      },
      0
    );

    expect(result).toHaveLength(1);

    expect(result).toHaveProperty('0.start', '2025-01');
    expect(result).toHaveProperty('0.end', '2025-12');
  });

  test('should throw if number of months is less than 0', () => {
    const fnc = (): unknown =>
      splitPeriodByMonths(
        {
          start: '2025-01',
          end: '2025-12',
        },
        -1
      );

    expect(fnc).toThrow('monthsPerPart must be at least 0');
  });
});
