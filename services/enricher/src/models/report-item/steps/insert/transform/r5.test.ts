import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// oxlint-disable-next-line import/default
import isbn from 'isbn3';
import { describe, expect, it, vi } from 'vitest';

import type { HarvestInsertOptions } from '@ezcounter/dto/harvest';

import { type R5ReportData, transformR5ItemToDocuments } from './r5';

vi.mock(import('isbn3'));

const EXAMPLES_DIR = join(process.cwd(), '__tests__/examples/items/5');

const readExampleFile = async (file: string): Promise<R5ReportData> =>
  JSON.parse(await readFile(join(EXAMPLES_DIR, file), 'utf8'));

describe('transform COUNTER 5 Item', () => {
  const OPTIONS: HarvestInsertOptions = {
    additionalData: {},
    additionalIdParts: ['foobar'],
    index: '',
  };

  it('should return iterator', async () => {
    expect.hasAssertions();
    const data = await readExampleFile('pr.json');

    const iterator = transformR5ItemToDocuments(data, OPTIONS);

    const iteration = iterator.next();

    expect(iteration).toHaveProperty('value');
  });

  it('should transform item', async () => {
    expect.hasAssertions();
    const data = await readExampleFile('pr.json');

    const iterator = transformR5ItemToDocuments(data, OPTIONS);
    const { value } = iterator.next();

    expect(value).toHaveProperty(
      'document',
      expect.objectContaining({
        // Should resolves count
        Count: 21,
        // Should transform Attribute_Performance
        Data_Type: 'Platform',
        // Should resolves metric type
        Metric_Type: 'Total_Item_Requests',
        // Should transform item data
        Platform: 'EBSCOhost',
        // Should transform header
        Report_Header: expect.objectContaining({
          Report_ID: 'PR',
        }),
        // Should resolves date
        X_Date_Month: '2015-01',
        // Should resolves harvest date
        X_Harvested_At: '2026-04-23T13:30:24.204Z',
      })
    );
    // Should generate id
    expect(value).toHaveProperty(
      'id',
      expect.stringMatching(
        /[0-9]{4}-[0-9]{2}:[a-z]{2}(?<part>:[a-z_]+){2}:[0-9a-f]+/v
      )
    );
  });

  it('should transform parent', async () => {
    expect.hasAssertions();
    const data = await readExampleFile('ir.json');

    const iterator = transformR5ItemToDocuments(data, OPTIONS);

    const { value } = iterator.next();

    expect(value).toHaveProperty(
      'document.Item_Parent.Item_Name',
      'Journal of Economics'
    );
  });

  it('should generate id with additionalIdParts', async () => {
    expect.hasAssertions();
    const data = await readExampleFile('pr.json');

    const iterator = transformR5ItemToDocuments(data, OPTIONS);

    const { value } = iterator.next();

    expect(value).toHaveProperty('id', expect.stringContaining('foobar'));
  });

  it('should format ISBN', async () => {
    expect.hasAssertions();
    const data = await readExampleFile('ir.json');

    const iterator = transformR5ItemToDocuments(data, OPTIONS);

    iterator.next();

    expect(isbn.asIsbn13).toHaveBeenCalledOnce();
  });

  it('should resolve on each count on each Performance on each Attribute_Performance', async () => {
    expect.hasAssertions();
    const data = await readExampleFile('pr.json');

    const iterator = transformR5ItemToDocuments(data, OPTIONS);

    let iterations = 0;
    let done = false;
    while (!done) {
      const item = iterator.next();
      // oxlint-disable vitest/no-conditional-in-test
      done = item.done ?? true;
      if (item.value) {
        iterations += 1;
      }
      // oxlint-enable vitest/no-conditional-in-test
    }

    expect(iterations).toBe(4);
  });
});
