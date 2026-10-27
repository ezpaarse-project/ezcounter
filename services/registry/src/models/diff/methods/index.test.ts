import { describe, expect, it } from 'vitest';

import { applyDiff, areHashEqual, flatten, objectDiff, unflatten } from '.';

describe('flatten object', () => {
  it('should return object with all nested key with dots', () => {
    expect.assertions(1);

    const result = flatten({
      bar: {
        foo: 'success',
      },
    });

    expect(result).toHaveProperty('bar.foo', 'success');
  });

  it('should handle arrays', () => {
    expect.assertions(1);

    const result = flatten({
      bar: ['success', 'failed'],
    });

    expect(result).toStrictEqual({
      'bar.0': 'success',
      'bar.1': 'failed',
    });
  });

  it('should match input of unflatten', () => {
    expect.assertions(1);

    const input = {
      'bar.foo': 'success',
    };

    const result = flatten(unflatten(input));

    expect(result).toStrictEqual(input);
  });
});

describe('unflatten object', () => {
  it('should return object with all nested key', () => {
    expect.assertions(1);

    const result = unflatten({
      'bar.foo': 'success',
    });

    expect(result).toHaveProperty('bar.foo', 'success');
  });

  it('should handle arrays', () => {
    expect.assertions(1);

    const result = unflatten({
      'bar.0': 'success',
      'bar.1': 'failed',
    });

    expect(result.bar).toBeInstanceOf(Array);
  });

  it('should match input of flatten', () => {
    expect.assertions(1);

    const input = {
      bar: {
        foo: 'success',
      },
    };

    const result = unflatten(flatten(input));

    expect(result).toStrictEqual(input);
  });
});

describe('compare hash', () => {
  it('should return true for equal objects', () => {
    expect.assertions(1);

    const obj1 = { first: 1, second: { third: 2 } };
    const obj2 = { first: 1, second: { third: 2 } };

    expect(areHashEqual(obj1, obj2)).toBe(true);
  });

  it('should return false for non-equal objects', () => {
    expect.assertions(1);

    const obj1 = { first: 1, second: { third: 2 } };
    const obj2 = { first: 1, second: { third: 3 } };

    expect(areHashEqual(obj1, obj2)).toBe(false);
  });
});

describe('diff objects', () => {
  it('should return an array of differences', () => {
    expect.assertions(1);

    const obj1 = { first: 1, second: { third: 2 } };
    const obj2 = { first: 1, second: { third: 3 } };

    const diffs = objectDiff(obj1, obj2);

    expect(diffs).toStrictEqual([
      {
        key: 'second.third',
        newValue: { key: 'second.third', value: 3 },
        oldValue: { key: 'second.third', value: 2 },
        type: 'changed' as const,
      },
    ]);
  });

  it('should handle added properties', () => {
    expect.assertions(1);

    const obj1 = { first: 1 };
    const obj2 = { first: 1, second: 2 };

    const diffs = objectDiff(obj1, obj2);

    expect(diffs).toStrictEqual([
      {
        key: 'second',
        newValue: { key: 'second', value: 2 },
        type: 'added' as const,
      },
    ]);
  });

  it('should handle removed properties', () => {
    expect.assertions(1);

    const obj1 = { first: 1, second: 2 };
    const obj2 = { first: 1 };

    const diffs = objectDiff(obj1, obj2);

    expect(diffs).toStrictEqual([
      {
        key: 'second',
        oldValue: { key: 'second', value: 2 },
        type: 'removed' as const,
      },
    ]);
  });
});

describe('aplly diff objects', () => {
  it('should apply diff entries to target object', () => {
    expect.assertions(1);

    const target = { first: 1, second: { third: 2 } };
    const diffs = [
      {
        key: 'second.third',
        newValue: { key: 'second.third', value: 3 },
        oldValue: { key: 'second.third', value: 2 },
        type: 'changed' as const,
      },
    ];

    const result = applyDiff(target, diffs);

    expect(result).toStrictEqual({ first: 1, second: { third: 3 } });
  });

  it('should handle added properties', () => {
    expect.assertions(1);

    const target = { first: 1 };
    const diffs = [
      {
        key: 'second',
        newValue: { key: 'second', value: 2 },
        type: 'added' as const,
      },
    ];

    const result = applyDiff(target, diffs);

    expect(result).toStrictEqual({ first: 1, second: 2 });
  });

  it('should handle removed properties', () => {
    expect.assertions(1);

    const target = { first: 1, second: 2 };
    const diffs = [
      {
        key: 'second',
        oldValue: { key: 'second', value: 2 },
        type: 'removed' as const,
      },
    ];

    const result = applyDiff(target, diffs);

    expect(result).toStrictEqual({ first: 1 });
  });
});
