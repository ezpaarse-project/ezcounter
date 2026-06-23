import { describe, expect, it, vi } from 'vitest';

import type { DataHostAuthCheckOptions } from '@ezcounter/dto/data-host';
import type { MessageMeta } from '@ezcounter/rabbitmq';

import { checkCredentials } from '~/models/data-host/auth/check';
import { IdleTimeoutController } from '~/models/idle-timeout';

import { onCredentialsCheckRequest } from './check';

vi.mock(import('~/models/data-host/auth/check'));

describe('handle Credentials check Request', () => {
  it('should call checkCredentials with provided options', async () => {
    expect.hasAssertions();
    vi.mocked(checkCredentials).mockResolvedValueOnce({
      errors: [],
      success: true,
    });

    const options: DataHostAuthCheckOptions = {
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      release: '5',
      report: { id: 'tr' },
    };

    const meta = {} as MessageMeta;
    const reply = vi.fn<(...args: unknown[]) => Promise<void>>();

    await onCredentialsCheckRequest(options, meta, reply);

    expect(checkCredentials).toHaveBeenCalledExactlyOnceWith(
      options,
      // oxlint-disable-next-line unicorn/no-useless-undefined
      undefined
    );
    expect(checkCredentials).toHaveBeenCalledBefore(reply);
    expect(reply).toHaveBeenCalledExactlyOnceWith({
      errors: [],
      success: true,
    });
  });

  it('should use expiration of message as timeout', async () => {
    expect.hasAssertions();
    vi.mocked(checkCredentials).mockResolvedValueOnce({
      errors: [],
      success: true,
    });

    const options: DataHostAuthCheckOptions = {
      dataHost: {
        auth: {},
        baseUrl: '',
      },
      release: '5',
      report: { id: 'tr' },
    };

    const meta = { expiration: '30000' } as MessageMeta;
    const reply = vi.fn<(...args: unknown[]) => Promise<void>>();

    await onCredentialsCheckRequest(options, meta, reply);

    expect(checkCredentials).toHaveBeenCalledExactlyOnceWith(
      options,
      expect.any(IdleTimeoutController)
    );
  });
});
