import { describe, expect, it, vi } from 'vitest';

// oxlint-disable-next-line vitest/no-mocks-import - mocked HarvestJobModel binds to a mockDeep instance
import { mockedHarvestJobModel } from '~/models/harvest/__mocks__';

import { onHarvestJobStatus } from './status';

vi.mock(import('~/models/harvest'));

describe('handle job status', () => {
  it('should update harvest job using throttle', async () => {
    expect.hasAssertions();
    onHarvestJobStatus({
      id: '',
      status: 'delayed',
    });

    // Let throttled function run
    await vi.runAllTimersAsync();

    expect(mockedHarvestJobModel.updateOneThrottled).toHaveBeenCalledOnce();
  });
});
