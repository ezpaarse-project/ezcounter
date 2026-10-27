import { describe, expect, it } from 'vitest';

import type { DataHost, DataHostChange } from '@ezcounter/database';

import { applyDataHostChanges } from './cast';

describe('apply changes on a report', () => {
  const report: DataHost = {
    createdAt: new Date(),
    id: 'id',
    local: true,
    name: '',
    params: {},
    updatedAt: null,
  };

  const change: DataHostChange = {
    createdAt: new Date(),
    dataHostId: 'id',
    diff: [
      {
        key: 'name',
        newValue: { key: 'name', value: 'Test endpoint' },
        oldValue: { key: 'name', value: '' },
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
  };

  it('should create a new object', () => {
    expect.assertions(1);

    const input = { ...report, changes: [change] };
    const output = applyDataHostChanges(input);

    expect(output).not.toBe(report);
  });

  it('should edit the name property', () => {
    expect.assertions(1);

    const input = { ...report, changes: [change] };
    const output = applyDataHostChanges(input);

    expect(output).toHaveProperty('name', 'Test endpoint');
  });

  it('should edit the params property', () => {
    expect.assertions(2);

    const input = { ...report, changes: [change] };
    const output = applyDataHostChanges(input);

    expect(output).toHaveProperty('params.test', true);
    expect(output).not.toHaveProperty('params.foo');
  });

  it('should add the ids of changes', () => {
    expect.assertions(1);

    const input = { ...report, changes: [change] };
    const output = applyDataHostChanges(input);

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
        },
      ],
    };
    const output = applyDataHostChanges(input);

    // oxlint-disable-next-line no-underscore-dangle
    expect(output._appliedChanges).not.toContain('change-id');
  });

  it('should skip invalid modifications but not the whole change', () => {
    expect.assertions(4);

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
              key: 'name',
              newValue: { key: 'name', value: 'Test endpoint' },
              oldValue: { key: 'name', value: '' },
              type: 'changed',
            },
            {
              key: 'local',
              newValue: { key: 'local', value: 785 },
              oldValue: { key: 'name', value: true },
              type: 'changed',
            },
          ],
          id: 'change-id',
          release: '5.1',
          reportId: 'tr',
        },
      ],
    };
    const output = applyDataHostChanges(input);

    expect(output).toHaveProperty('name', 'Test endpoint');
    // 0 is not a valid property
    expect(output).not.toHaveProperty('0');
    // Unknown is not a valid property
    expect(output).not.toHaveProperty('unknown');
    // Period format must be a string
    expect(output).not.toHaveProperty('local', 785);
  });

  it('should throw on invalid report', () => {
    expect.assertions(1);

    const input = { ...report, changes: [], params: { foobar: [false, true] } };
    // oxlint-disable-next-line typescript/explicit-function-return-type
    const fnc = () => applyDataHostChanges(input);

    expect(fnc).toThrow('Invalid input');
  });
});
