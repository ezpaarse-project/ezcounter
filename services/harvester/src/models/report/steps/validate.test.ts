import { describe, expect, test } from 'vitest';

import { getCounterValidation } from './validate';

describe('COUNTER unknown', () => {
  test('should throws if release is unknown', () => {
    const fnc = (): unknown => getCounterValidation('foo', 'bar');

    expect(fnc).toThrow('COUNTER Release foo is unknown');
  });
});

describe('COUNTER 5', () => {
  describe('Report Validation (getCounterValidation)', () => {
    test('should have validation for PR', () => {
      const validation = getCounterValidation('5', 'PR');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for DR', () => {
      const validation = getCounterValidation('5', 'DR');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for TR', () => {
      const validation = getCounterValidation('5', 'TR');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for IR', () => {
      const validation = getCounterValidation('5', 'IR');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for unknown', () => {
      const validation = getCounterValidation('5', '');
      expect(validation.header).toBe(undefined);
      expect(validation.item).toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
  });
});

describe('COUNTER 5.1', () => {
  describe('Report Validation (getCounterValidation)', () => {
    test('should have validation for PR', () => {
      const validation = getCounterValidation('5.1', 'PR');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for PR_P1', () => {
      const validation = getCounterValidation('5.1', 'PR_P1');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for DR', () => {
      const validation = getCounterValidation('5.1', 'DR');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for DR_D1', () => {
      const validation = getCounterValidation('5.1', 'DR_D1');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for DR_D2', () => {
      const validation = getCounterValidation('5.1', 'DR_D2');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for TR', () => {
      const validation = getCounterValidation('5.1', 'TR');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for TR_B1', () => {
      const validation = getCounterValidation('5.1', 'TR_B1');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for TR_B2', () => {
      const validation = getCounterValidation('5.1', 'TR_B2');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for TR_B3', () => {
      const validation = getCounterValidation('5.1', 'TR_B3');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for TR_J1', () => {
      const validation = getCounterValidation('5.1', 'TR_J1');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for TR_J2', () => {
      const validation = getCounterValidation('5.1', 'TR_J2');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for TR_J3', () => {
      const validation = getCounterValidation('5.1', 'TR_J3');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for TR_J4', () => {
      const validation = getCounterValidation('5.1', 'TR_J4');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for IR', () => {
      const validation = getCounterValidation('5.1', 'IR');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for IR_A1', () => {
      const validation = getCounterValidation('5.1', 'IR_A1');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for IR_M1', () => {
      const validation = getCounterValidation('5.1', 'IR_M1');
      expect(validation.header).not.toBe(undefined);
      expect(validation.item).not.toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
    test('should have validation for unknown', () => {
      const validation = getCounterValidation('5.1', '');
      expect(validation.header).toBe(undefined);
      expect(validation.item).toBe(undefined);
      expect(validation.exception).not.toBe(undefined);
    });
  });
});
