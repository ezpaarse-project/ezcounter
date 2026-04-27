import { describe, expect, test, vi } from 'vitest';

import { updateOneHarvestJobThrottled } from '~/models/harvest/__mocks__';

import { onEnrichJobStatus } from './status';

vi.mock(import('~/models/harvest'));

describe('Handle job status (onHarvestJobStatus)', () => {
  test('should update harvest job using throttle', async () => {
    onEnrichJobStatus({
      id: '',
      status: 'processing',
    });

    // Let throttled function run
    await vi.runAllTimersAsync();

    expect(updateOneHarvestJobThrottled).toBeCalled();
  });
});
