import { PassThrough } from 'node:stream';

import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { MessageMeta } from '@ezcounter/rabbitmq';

import { receiveThroughTCP } from '~/lib/tcp/server';

import { validateReport } from '~/models/report/validation';

import { onValidationRequest } from './validate';

vi.mock(import('~/lib/tcp/server'));
vi.mock(import('~/models/report/validation'));

describe('Handle Validation Request (onValidationRequest)', () => {
  test('should setup TCP server before sending address', async () => {
    vi.mocked(receiveThroughTCP).mockResolvedValueOnce({
      addr: { address: '1.2.3.4', family: 'IPv4', port: 4567 },
      stream: new PassThrough(),
    });

    const meta = mockDeep<MessageMeta>();
    const reply = vi.fn();

    await onValidationRequest({ release: '5', reportId: 'ir' }, meta, reply);

    expect(receiveThroughTCP).toHaveBeenCalledOnce();
    expect(receiveThroughTCP).toHaveBeenCalledBefore(reply);
    expect(reply).toHaveBeenCalledExactlyOnceWith({
      host: '1.2.3.4',
      port: 4567,
    });
  });

  test('should validate once before socket is closed', async () => {
    vi.mocked(receiveThroughTCP).mockImplementationOnce((reply) => {
      setTimeout(() => reply?.(), 10);

      return Promise.resolve({
        addr: { address: '1.2.3.4', family: 'IPv4', port: 4567 },
        stream: new PassThrough(),
      });
    });

    const meta = mockDeep<MessageMeta>();
    const reply = vi.fn();

    await onValidationRequest({ release: '5', reportId: 'ir' }, meta, reply);

    await vi.runAllTimersAsync();
    expect(validateReport).toHaveBeenCalledBefore(reply);
  });

  test('should use expiration of message as timeout to setup TCP server', async () => {
    vi.mocked(receiveThroughTCP).mockResolvedValueOnce({
      addr: { address: '1.2.3.4', family: 'IPv4', port: 4567 },
      stream: new PassThrough(),
    });

    const meta = mockDeep<MessageMeta>();
    meta.expiration = '30000';
    const reply = vi.fn();

    await onValidationRequest({ release: '5', reportId: 'ir' }, meta, reply);

    expect(receiveThroughTCP).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      { expiration: 30_000 }
    );
  });
});
