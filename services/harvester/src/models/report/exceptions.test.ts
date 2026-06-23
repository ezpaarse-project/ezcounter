import { describe, expect, it } from 'vitest';

import { asHarvestException } from './exceptions';

describe('http code as HarvestException', () => {
  it('should return pre-registered exception', () => {
    expect.hasAssertions();
    const exception = asHarvestException(202);

    expect(exception).toMatchObject({
      code: `counter:1011`,
      message: 'Report is being processed',
      severity: 'info',
    });
  });

  it('should return undefined if not an error and not registered', () => {
    expect.hasAssertions();
    const exception = asHarvestException(200);

    expect(exception).toBeUndefined();
  });

  it('should return HTTP exception if error and not registered', () => {
    expect.hasAssertions();
    const exception = asHarvestException(418);

    expect(exception).toMatchObject({
      code: `http:418`,
      message: "I'm a teapot",
      severity: 'error',
    });
  });

  it('should return generic error if HTTP code is unknown', () => {
    expect.hasAssertions();
    const exception = asHarvestException(999);

    expect(exception).toMatchObject({
      code: `http:999`,
      message: 'Unknown status',
      severity: 'error',
    });
  });
});

describe('exception as HarvestException', () => {
  it('should return warn for codes between 1 and 999', () => {
    expect.hasAssertions();
    const exception = asHarvestException({
      Code: 512,
      Message: '512 is a custom warning',
    });

    expect(exception.severity).toBe('warn');
  });

  describe('should sanitise severity if provided', () => {
    it('debug', () => {
      expect.hasAssertions();
      const exception = asHarvestException({
        Code: 9999,
        Message: '9999 is not standard, but should be considered as info',
        Severity: 'Debug',
      });

      expect(exception.severity).toBe('info');
    });

    it('fatal', () => {
      expect.hasAssertions();
      const exception = asHarvestException({
        Code: 9999,
        Message: '9999 is not standard, but should be considered as error',
        Severity: 'Fatal',
      });

      expect(exception.severity).toBe('error');
    });
  });

  it('should error if unknown', () => {
    expect.hasAssertions();
    const exception = asHarvestException({
      Code: 9999,
      Message: '9999 is not standard, but should be considered as error',
    });

    expect(exception.severity).toBe('error');
  });

  it('should return code with prefix', () => {
    expect.hasAssertions();
    const exception = asHarvestException({
      Code: 2000,
      Message: 'Requestor Not Authorized to Access Service',
    });

    expect(exception.code).toBe('counter:2000');
  });

  it('should return data instead of message', () => {
    expect.hasAssertions();
    const exception = asHarvestException({
      Code: 2000,
      Data: 'API key is invalid',
      Message: 'Requestor Not Authorized to Access Service',
    });

    expect(exception.message).toBe('API key is invalid');
  });

  it('should return help url if provided', () => {
    expect.hasAssertions();
    const exception = asHarvestException({
      Code: 2000,
      Data: 'API key is invalid',
      Help_URL: 'https://readmetrics.org/',
      Message: 'Requestor Not Authorized to Access Service',
    });

    expect(exception.helpUrl).toBe('https://readmetrics.org/');
  });
});
