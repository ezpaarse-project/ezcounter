import { describe, expect, test } from 'vitest';
import { fs } from 'memfs';

import { asHarvestError, asHarvestException } from './exceptions';

describe('HTTP code as HarvestException (asHarvestException)', () => {
  test('should return pre-registered exception', () => {
    const exception = asHarvestException(202);

    expect(exception).toMatchObject({
      severity: 'info',
      code: `counter:1011`,
      message: 'Report is being processed',
    });
  });

  test('should return undefined if not an error and not registered', () => {
    const exception = asHarvestException(200);

    expect(exception).toBe(undefined);
  });

  test('should return HTTP exception if error and not registered', () => {
    const exception = asHarvestException(418);

    expect(exception).toMatchObject({
      severity: 'error',
      code: `http:418`,
      message: "I'm a teapot",
    });
  });

  test('should return generic error if HTTP code is unknown', () => {
    const exception = asHarvestException(999);

    expect(exception).toMatchObject({
      severity: 'error',
      code: `http:999`,
      message: 'Unknown status',
    });
  });
});

describe('Exception as HarvestException (asHarvestException)', () => {
  test('should return warn for codes between 1 and 999', () => {
    const exception = asHarvestException({
      Code: 512,
      Message: '512 is a custom warning',
    });

    expect(exception.severity).toBe('warn');
  });

  describe('should sanitise severity if provided', () => {
    test('debug', () => {
      const exception = asHarvestException({
        Code: 9999,
        Message: '9999 is not standard, but should be considered as info',
        Severity: 'Debug',
      });

      expect(exception.severity).toBe('info');
    });

    test('fatal', () => {
      const exception = asHarvestException({
        Code: 9999,
        Message: '9999 is not standard, but should be considered as error',
        Severity: 'Fatal',
      });

      expect(exception.severity).toBe('error');
    });
  });

  test('should error if unknown', () => {
    const exception = asHarvestException({
      Code: 9999,
      Message: '9999 is not standard, but should be considered as error',
    });

    expect(exception.severity).toBe('error');
  });

  test('should return code with prefix', () => {
    const exception = asHarvestException({
      Code: 2000,
      Message: 'Requestor Not Authorized to Access Service',
    });

    expect(exception.code).toBe('counter:2000');
  });

  test('should return data instead of message', () => {
    const exception = asHarvestException({
      Code: 2000,
      Message: 'Requestor Not Authorized to Access Service',
      Data: 'API key is invalid',
    });

    expect(exception.message).toBe('API key is invalid');
  });

  test('should return help url if provided', () => {
    const exception = asHarvestException({
      Code: 2000,
      Message: 'Requestor Not Authorized to Access Service',
      Data: 'API key is invalid',
      Help_URL: 'https://readmetrics.org/',
    });

    expect(exception.helpUrl).toBe('https://readmetrics.org/');
  });
});

describe('Error as HarvestError (asHarvestError)', () => {
  test('should extract informations from custom error', () => {
    const err = new Error('This is an example error', {
      cause: 'The cause of the error, mainly validation errors',
    });

    let result = asHarvestError(err);

    expect(result).toMatchObject({
      code: `app:ERROR`,
      message: err.message,
      cause: err.cause,
    });
  });

  test('should extract informations from system error', () => {
    let error;
    try {
      fs.readFileSync('file-that-will-not-exists');
      throw new Error("File shouldn't exists");
    } catch (err) {
      error = err as Error;
    }

    const result = asHarvestError(error);

    expect(result).toMatchObject({
      code: `app:ENOENT`,
      message: error.message,
    });
  });

  test('should return generic Error if not an Error', () => {
    const err = 'This error is weird';

    let result = asHarvestError(err);

    expect(result).toMatchObject({
      code: `app:UNKNOWN_ERROR`,
      message: err,
    });
  });
});
