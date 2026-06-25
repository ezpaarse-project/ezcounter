import { describe, expect, it, vi } from 'vitest';

import { triggerWebhook } from '~/lib/webhooks';

import type { HarvestJob } from './dto';
import { triggerHarvestHooks } from './hooks';

vi.mock(import('~/lib/webhooks'));

describe('trigger harvest hooks', () => {
  // oxlint-disable-next-line consistent-function-scoping
  const getJob = (): HarvestJob => ({
    createdAt: new Date(),
    dataHostId: '',
    download: { status: 'processing' },
    enrich: { status: 'processing' },
    enrichSources: [],
    error: null,
    extract: { status: 'processing' },
    forceDownload: false,
    hooks: {
      additionalData: { foo: 'bar' },
      onEnd: {
        target: 'https://myapp.localhost/hooks/onHarvestJobEnd',
      },
      onStepEnd: {
        target: 'https://myapp.localhost/hooks/onHarvestStepEnd',
      },
    },
    id: '',
    index: '',
    insert: { status: 'processing' },
    params: {},
    period: { end: '2025-12', start: '2025-01' },
    release: '5.1',
    reportId: '',
    requestId: '',
    startedAt: null,
    status: 'pending',
    timeout: 60_000,
    took: null,
    updatedAt: null,
  });

  it('should NOT throw on invalid data', async () => {
    expect.assertions(1);

    const promise = triggerHarvestHooks({} as HarvestJob);

    await expect(promise).resolves.not.toThrow();
  });

  describe('on job end', () => {
    it('should trigger if job is errored', async () => {
      expect.assertions(1);
      const target = getJob();
      const source = getJob();

      target.status = 'error';

      await triggerHarvestHooks(target, source);

      expect(triggerWebhook).toHaveBeenCalledExactlyOnceWith(
        'https://myapp.localhost/hooks/onHarvestJobEnd',
        {
          job: expect.objectContaining(target),
          meta: { foo: 'bar' },
        }
      );
    });

    it('should trigger if job is complete', async () => {
      expect.assertions(1);
      const target = getJob();

      target.status = 'done';

      await triggerHarvestHooks(target);

      expect(triggerWebhook).toHaveBeenCalledExactlyOnceWith(
        'https://myapp.localhost/hooks/onHarvestJobEnd',
        {
          job: expect.objectContaining(target),
          meta: { foo: 'bar' },
        }
      );
    });

    it('should NOT trigger if job not ended', async () => {
      expect.assertions(1);
      const target = getJob();
      const source = getJob();

      target.status = 'processing';

      await triggerHarvestHooks(target, source);

      expect(triggerWebhook).not.toHaveBeenCalled();
    });

    it('should NOT trigger if job already ended', async () => {
      expect.assertions(1);
      const target = getJob();
      const source = getJob();

      source.status = 'error';
      target.status = 'error';

      await triggerHarvestHooks(target, source);

      expect(triggerWebhook).not.toHaveBeenCalled();
    });
  });

  describe('on step end', () => {
    it('should trigger if step is complete', async () => {
      expect.assertions(1);
      const target = getJob();
      const source = getJob();

      target.download.status = 'done';

      await triggerHarvestHooks(target, source);

      expect(triggerWebhook).toHaveBeenCalledExactlyOnceWith(
        'https://myapp.localhost/hooks/onHarvestStepEnd',
        {
          meta: { foo: 'bar' },
          step: expect.objectContaining(target.download),
        }
      );
    });

    it('should NOT trigger if step not ended', async () => {
      expect.assertions(1);
      const target = getJob();
      const source = getJob();

      target.extract.status = 'processing';

      await triggerHarvestHooks(target, source);

      expect(triggerWebhook).not.toHaveBeenCalled();
    });

    it('should trigger before job completion', async () => {
      expect.assertions(2);
      const target = getJob();
      const source = getJob();

      target.status = 'done';
      target.download.status = 'done';

      await triggerHarvestHooks(target, source);

      expect(triggerWebhook).toHaveBeenNthCalledWith(
        1,
        'https://myapp.localhost/hooks/onHarvestStepEnd',
        expect.anything()
      );
      expect(triggerWebhook).toHaveBeenNthCalledWith(
        2,
        'https://myapp.localhost/hooks/onHarvestJobEnd',
        expect.anything()
      );
    });

    it('should NOT trigger if step already ended', async () => {
      expect.assertions(1);
      const target = getJob();
      const source = getJob();

      source.insert.status = 'done';
      target.insert.status = 'done';

      await triggerHarvestHooks(target, source);

      expect(triggerWebhook).not.toHaveBeenCalled();
    });
  });
});
