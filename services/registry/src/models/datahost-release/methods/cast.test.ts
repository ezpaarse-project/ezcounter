import { describe, expect, it } from 'vitest';

import type {
  DataHostRelease,
  DataHostReleaseChange,
} from '@ezcounter/database';

import { applyDataHostReleaseChanges } from './cast';

describe('apply changes on a report', () => {
  const report: DataHostRelease = {
    availableSince: null,
    baseURL: 'https://example.com',
    compliant: false,
    createdAt: new Date(),
    dataHostId: 'id',
    params: {},
    paramsSeparator: '|',
    periodFormat: 'yyyy-MM',
    release: '5.1',
    requiredAuth: {
      customer_id: true,
      requestor_id: true,
    },
    supported: true,
    updatedAt: null,
  };

  const change: DataHostReleaseChange = {
    createdAt: new Date(),
    dataHostId: 'id',
    diff: [
      {
        key: 'supported',
        newValue: { key: 'supported', value: false },
        oldValue: { key: 'supported', value: true },
        type: 'changed',
      },
      {
        key: 'requiredAuth.api_key',
        newValue: { key: 'requiredAuth.api_key', value: true },
        type: 'added',
      },
      {
        key: 'requiredAuth.requestor_id',
        oldValue: { key: 'requiredAuth.requestor_id', value: true },
        type: 'removed',
      },
    ],
    id: 'change-id',
    release: '5.1',
  };

  it('should create a new object', () => {
    expect.assertions(1);

    const input = { ...report, changes: [change] };
    const output = applyDataHostReleaseChanges(input);

    expect(output).not.toBe(report);
  });

  it('should edit the supported property', () => {
    expect.assertions(1);

    const input = { ...report, changes: [change] };
    const output = applyDataHostReleaseChanges(input);

    expect(output).toHaveProperty('supported', false);
  });

  it('should update the requiredAuth property', () => {
    expect.assertions(2);

    const input = { ...report, changes: [change] };
    const output = applyDataHostReleaseChanges(input);

    expect(output).toHaveProperty('requiredAuth.api_key', true);
    expect(output).not.toHaveProperty('requiredAuth.requestor_id');
  });

  it('should add the ids of changes', () => {
    expect.assertions(1);

    const input = { ...report, changes: [change] };
    const output = applyDataHostReleaseChanges(input);

    // oxlint-disable-next-line no-underscore-dangle
    expect(output._appliedChanges).toContain('change-id');
  });

  it('should skip empty changes', () => {
    expect.assertions(1);

    const input = {
      ...report,
      changes: [
        {
          createdAt: new Date(),
          dataHostId: 'id',
          diff: [],
          id: 'change-id',
          release: '5.1',
        },
      ],
    };
    const output = applyDataHostReleaseChanges(input);

    // oxlint-disable-next-line no-underscore-dangle
    expect(output._appliedChanges).not.toContain('change-id');
  });

  it('should skip invalid modifications but not the whole change', () => {
    expect.assertions(5);

    const input = {
      ...report,
      changes: [
        {
          createdAt: new Date(),
          dataHostId: 'id',
          diff: [
            { key: 0, newValue: { key: 0, value: '1' }, type: 'added' },
            {
              key: 'unknown',
              newValue: { key: 'unknown', value: null },
              type: 'added',
            },
            {
              key: 'supported',
              newValue: { key: 'supported', value: false },
              type: 'added',
            },
            {
              key: 'baseURL',
              newValue: { key: 'baseURL', value: 'abc' },
              oldValue: { key: 'baseURL', value: 'https://example.com' },
              type: 'changed',
            },
            {
              key: 'periodFormat',
              newValue: { key: 'periodFormat', value: 785 },
              oldValue: { key: 'periodFormat', value: 'yyyy-MM' },
              type: 'changed',
            },
          ],
          id: 'change-id',
          release: '5.1',
          reportId: 'tr',
        },
      ],
    };
    const output = applyDataHostReleaseChanges(input);

    expect(output).toHaveProperty('supported', false);
    // 0 is not a valid property
    expect(output).not.toHaveProperty('0');
    // Unknown is not a valid property
    expect(output).not.toHaveProperty('unknown');
    // Base URL must match format
    expect(output).not.toHaveProperty('baseURL', 'abc');
    // Period format must be a string
    expect(output).not.toHaveProperty('periodFormat', 785);
  });

  it('should throw on invalid report', () => {
    expect.assertions(1);

    const input = { ...report, changes: [], release: 'abc' };
    // oxlint-disable-next-line typescript/explicit-function-return-type
    const fnc = () => applyDataHostReleaseChanges(input);

    expect(fnc).toThrow('Invalid option');
  });
});
