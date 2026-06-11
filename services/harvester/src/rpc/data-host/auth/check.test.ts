import { describe, expect, test, vi } from 'vitest';

import type { DataHostAuthCheckOptions } from '@ezcounter/dto/data-host';
import type { MessageMeta } from '@ezcounter/rabbitmq';

import { checkCredentials } from '~/models/data-host/auth/check';
import { IdleTimeoutController } from '~/models/idle-timeout';

import { onCredentialsCheckRequest } from './check';

vi.mock(import('~/models/data-host/auth/check'));

describe('Handle Credentials check Request (onCredentialsCheckRequest)', () => {
  test('should call checkCredentials with provided options', async () => {
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
    const reply = vi.fn();

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

  test('should use expiration of message as timeout', async () => {
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
    const reply = vi.fn();

    await onCredentialsCheckRequest(options, meta, reply);

    expect(checkCredentials).toHaveBeenCalledExactlyOnceWith(
      options,
      expect.any(IdleTimeoutController)
    );
  });
});
