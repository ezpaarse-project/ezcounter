import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { updateOneHarvestJob } from '~/models/harvest/__mocks__';

import { onHarvestJobStatus } from './status';

vi.mock('~/models/harvest');

beforeEach(() => {
  vi.useFakeTimers();
});

describe('Handle job status (onHarvestJobStatus)', () => {
  test('should update harvest job', async () => {
    updateOneHarvestJob.mockRejectedValueOnce({ status: 'done' });

    onHarvestJobStatus({
      id: '',
      status: 'done',
    });

    // Let throttled function run
    await vi.runAllTimersAsync();

    expect(updateOneHarvestJob).toBeCalled();
  });

  test('should merge updates', async () => {
    updateOneHarvestJob.mockRejectedValueOnce({ status: 'done' });

    // Send events of 2 jobs to check if updates are correctly merged by job id
    onHarvestJobStatus({
      id: 'first-job',
      status: 'pending',
    });
    onHarvestJobStatus({
      id: 'second-job',
      status: 'processing',
      download: {
        done: true,
        progress: 1,
      },
    });
    onHarvestJobStatus({
      id: 'first-job',
      status: 'delayed',
      download: {
        done: false,
        httpCode: 500,
      },
    });
    onHarvestJobStatus({
      id: 'second-job',
      status: 'done',
      download: {
        done: true,
        httpCode: 200,
      },
      extract: {
        done: true,
      },
    });

    // Let throttled function run
    await vi.runAllTimersAsync();

    expect(updateOneHarvestJob).toBeCalledWith({
      id: 'second-job',
      status: 'done',
      download: {
        done: true,
        progress: 1,
        httpCode: 200,
      },
      extract: {
        done: true,
      },
    });
  });

  test('should throttle updates', async () => {
    updateOneHarvestJob.mockRejectedValueOnce({ status: 'done' });

    // Send events of 2 jobs to check if updates are correctly throttled by job id
    onHarvestJobStatus({
      id: 'first-job',
      status: 'pending',
    });
    onHarvestJobStatus({
      id: 'second-job',
      status: 'processing',
    });
    onHarvestJobStatus({
      id: 'first-job',
      status: 'delayed',
    });
    onHarvestJobStatus({
      id: 'second-job',
      status: 'done',
    });

    // Let throttled function run
    await vi.runAllTimersAsync();

    // should have been called 1 per job id
    expect(updateOneHarvestJob).toBeCalledTimes(2);
  });
});

afterEach(() => {
  vi.useRealTimers();
});
