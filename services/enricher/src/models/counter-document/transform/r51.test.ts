import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import type { HarvestInsertOptions } from '@ezcounter/dto/harvest';

import { asIsbn13 } from '~/../__mocks__/isbn3';

import { type R51ReportData, transformR51ItemToDocuments } from './r51';

vi.mock(import('isbn3'));

const EXAMPLES_DIR = join(
  import.meta.dirname,
  '../../../../__tests__/examples/items/5.1'
);

const readExampleFile = (file: string): R51ReportData =>
  JSON.parse(readFileSync(join(EXAMPLES_DIR, file), 'utf8'));

describe('Transform COUNTER 5.1 Item (transformR51ItemToDocuments)', () => {
  const OPTIONS: HarvestInsertOptions = {
    additionalData: {},
    additionalIdParts: ['foobar'],
    index: '',
  };

  it('should return iterator', () => {
    const data = readExampleFile('pr.json');

    const iterator = transformR51ItemToDocuments(data, OPTIONS);

    const iteration = iterator.next();

    expect(iteration).toHaveProperty('value');
  });

  it('should transform item', () => {
    const data = readExampleFile('pr.json');

    const iterator = transformR51ItemToDocuments(data, OPTIONS);
    const { value } = iterator.next();

    expect(value).toMatchObject({
      // Should resolves count
      Count: 1461,
      // Should transform Attribute_Performance
      Data_Type: 'Article',
      // Should resolves metric type
      Metric_Type: 'Total_Item_Investigations',
      // Should transform item data
      Platform: 'Platform 1',
      // Should transform header
      Report_Header: {
        Report_ID: 'PR',
      },
      // Should resolves date
      X_Date_Month: '2022-01',
      // Should resolves harvest date
      X_Harvested_At: '2026-04-23T13:30:24.204Z',
      // Should generate id
      _id: expect.stringMatching(
        /[0-9]{4}-[0-9]{2}:[a-z]{2}(:[a-z_]+){2}:[0-9a-f]+/
      ),
    });
  });

  it('should transform parent', () => {
    const data = readExampleFile('ir.json');

    const iterator = transformR51ItemToDocuments(data, OPTIONS);

    const { value } = iterator.next();

    expect(value).toHaveProperty('Item_Parent.Item_Name', 'Title 2');
  });

  it('should generate id with additionalIdParts', () => {
    const data = readExampleFile('pr.json');

    const iterator = transformR51ItemToDocuments(data, OPTIONS);

    const { value } = iterator.next();

    expect(value._id).toContain('foobar');
  });

  it('should format ISBN', () => {
    const data = readExampleFile('ir.json');

    const iterator = transformR51ItemToDocuments(data, OPTIONS);

    iterator.next();

    expect(asIsbn13).toBeCalled();
  });

  it('should resolve on each count on each Performance on each Attribute_Performance', () => {
    const data = readExampleFile('pr.json');

    const iterator = transformR51ItemToDocuments(data, OPTIONS);

    let iterations = 0;
    let done = false;
    while (!done) {
      const item = iterator.next();
      done = item.done ?? true;
      if (item.value) {
        iterations += 1;
      }
    }

    expect(iterations).toBe(24);
  });
});
