import { describe, expect, test, vi } from 'vitest';

import { updateOneHarvestJobThrottled } from '~/models/harvest/__mocks__';

import { onHarvestJobStatus } from './status';

vi.mock(import('~/models/harvest'));

describe('Handle job status (onHarvestJobStatus)', () => {
  test('should update harvest job using throttle', async () => {
    onHarvestJobStatus({
      id: '',
      status: 'delayed',
    });

    // Let throttled function run
    await vi.runAllTimersAsync();

    expect(updateOneHarvestJobThrottled).toBeCalled();
  });
});
