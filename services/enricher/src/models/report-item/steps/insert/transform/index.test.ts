import { describe, expect, test, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { HarvestInsertOptions } from '@ezcounter/dto/harvest';
import type { EnrichJobContent } from '@ezcounter/dto/queues';

import { transformReportItemToDocuments } from '.';
import { transformR5ItemToDocuments } from './r5';
import { transformR51ItemToDocuments } from './r51';

vi.mock(import('./r5'));
vi.mock(import('./r51'));

describe('Transform COUNTER Item (transformReportItemToDocuments)', () => {
  const OPTIONS: HarvestInsertOptions = {
    additionalData: {},
    additionalIdParts: [],
    index: '',
  };

  test('should supports COUNTER 5', () => {
    const data = mockDeep<EnrichJobContent>();
    data.header.Release = '5';

    transformReportItemToDocuments(data, OPTIONS);

    expect(transformR5ItemToDocuments).toHaveBeenCalledExactlyOnceWith(
      data,
      OPTIONS
    );
  });

  test('should supports COUNTER 5.1', () => {
    const data = mockDeep<EnrichJobContent>();
    data.header.Release = '5.1';

    transformReportItemToDocuments(data, OPTIONS);

    expect(transformR51ItemToDocuments).toHaveBeenCalledExactlyOnceWith(
      data,
      OPTIONS
    );
  });

  test('should throw if COUNTER Release is not supported', () => {
    const data = mockDeep<EnrichJobContent>();
    data.header.Release = '0';

    const fnc = (): unknown => transformReportItemToDocuments(data, OPTIONS);

    expect(fnc).toThrow('Release 0 is unknown');
  });
});
