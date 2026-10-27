import { describe, expect, it } from 'vitest';

import type { DataHostReport, DataHostReportChange } from '@ezcounter/database';

import { applyDataHostReportChanges } from './cast';

describe('apply changes on a report', () => {
  const report: DataHostReport = {
    createdAt: new Date(),
    dataHostId: 'id',
    firstMonthAvailable: null,
    lastMonthAvailable: null,
    params: {
      foo: 'bar',
    },
    release: '5.1',
    reportId: 'tr',
    supported: null,
    updatedAt: null,
  };

  const change: DataHostReportChange = {
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
        key: 'params.test',
        newValue: { key: 'params.test', value: true },
        type: 'added',
      },
      {
        key: 'params.foo',
        oldValue: { key: 'params.foo', value: 'bar' },
        type: 'removed',
      },
    ],
    id: 'change-id',
    release: '5.1',
    reportId: 'tr',
  };

  it('should create a new object', () => {
    expect.assertions(1);

    const input = { ...report, changes: [change] };
    const output = applyDataHostReportChanges(input);

    expect(output).not.toBe(report);
  });

  it('should edit the supported property', () => {
    expect.assertions(1);

    const input = { ...report, changes: [change] };
    const output = applyDataHostReportChanges(input);

    expect(output).toHaveProperty('supported', false);
  });

  it('should edit the params property', () => {
    expect.assertions(2);

    const input = { ...report, changes: [change] };
    const output = applyDataHostReportChanges(input);

    expect(output).toHaveProperty('params.test', true);
    expect(output).not.toHaveProperty('params.foo');
  });

  it('should add the ids of changes', () => {
    expect.assertions(1);

    const input = { ...report, changes: [change] };
    const output = applyDataHostReportChanges(input);

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
          reportId: 'tr',
        },
      ],
    };
    const output = applyDataHostReportChanges(input);

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
            { key: 0, newValue: { key: 0, value: '1' } },
            {
              key: 'unknown',
              newValue: { key: 'unknown', value: null },
              type: 'changed',
            },
            {
              key: 'supported',
              newValue: { key: 'supported', value: false },
              oldValue: { key: 'supported', value: true },
              type: 'changed',
            },
            {
              key: 'firstMonthAvailable',
              newValue: { key: 'firstMonthAvailable', value: 'abc' },
              oldValue: { key: 'firstMonthAvailable', value: null },
              type: 'changed',
            },
            {
              key: 'lastMonthAvailable',
              newValue: { key: 'lastMonthAvailable', value: 785 },
              oldValue: { key: 'lastMonthAvailable', value: null },
              type: 'changed',
            },
          ],
          id: 'change-id',
          release: '5.1',
          reportId: 'tr',
        },
      ],
    };
    const output = applyDataHostReportChanges(input);

    expect(output).toHaveProperty('supported', false);
    // 0 is not a valid property
    expect(output).not.toHaveProperty('0');
    // Unknown is not a valid property
    expect(output).not.toHaveProperty('unknown');
    // First month available must match format
    expect(output).not.toHaveProperty('firstMonthAvailable', 'abc');
    // Last month available must be a string
    expect(output).not.toHaveProperty('lastMonthAvailable', 785);
  });

  it('should throw on invalid report', () => {
    expect.assertions(1);

    const input = { ...report, changes: [], firstMonthAvailable: 'abc' };
    // oxlint-disable-next-line typescript/explicit-function-return-type
    const fnc = () => applyDataHostReportChanges(input);

    expect(fnc).toThrow('Invalid date-month');
  });
});
