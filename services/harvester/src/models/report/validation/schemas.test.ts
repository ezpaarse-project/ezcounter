import { describe, expect, it } from 'vitest';

import { getCounterValidation } from './schemas';

describe('counter unknown', () => {
  it('should throws if release is unknown', () => {
    expect.hasAssertions();
    expect((): unknown => getCounterValidation('foo', 'bar')).toThrow(
      'COUNTER Release foo is unknown'
    );
  });
});

describe('counter 5', () => {
  describe('report Validation', () => {
    it('should have validation for PR', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5', 'PR');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for DR', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5', 'DR');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for TR', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5', 'TR');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for IR', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5', 'IR');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for unknown', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5', '');
      expect(validation.header).toBeUndefined();
      expect(validation.item).toBeUndefined();
      expect(validation.exception).toBeDefined();
    });
  });
});

describe('counter 5.1', () => {
  describe('report Validation', () => {
    it('should have validation for PR', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'PR');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for PR_P1', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'PR_P1');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for DR', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'DR');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for DR_D1', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'DR_D1');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for DR_D2', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'DR_D2');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for TR', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'TR');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for TR_B1', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'TR_B1');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for TR_B2', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'TR_B2');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for TR_B3', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'TR_B3');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for TR_J1', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'TR_J1');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for TR_J2', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'TR_J2');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for TR_J3', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'TR_J3');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for TR_J4', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'TR_J4');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for IR', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'IR');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for IR_A1', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'IR_A1');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for IR_M1', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', 'IR_M1');
      expect(validation.header).toBeDefined();
      expect(validation.item).toBeDefined();
      expect(validation.exception).toBeDefined();
    });
    it('should have validation for unknown', () => {
      expect.hasAssertions();
      const validation = getCounterValidation('5.1', '');
      expect(validation.header).toBeUndefined();
      expect(validation.item).toBeUndefined();
      expect(validation.exception).toBeDefined();
    });
  });
});
