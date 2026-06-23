import { describe, expect, it, vi } from 'vitest';

import { IRReportHeader as validate } from '@ezcounter/counter/schemas/r51';

import { appConfig } from '~/lib/config';
import { createReadStream, createWriteStream, mkdir, unlink } from '~/lib/fs';

import { extractReportHeader } from '~/models/report/extraction/header';
import { extractReportItems } from '~/models/report/extraction/items';

import type { COUNTERReportItem } from '../dto';
import { validateReport } from '.';

vi.mock(import('~/models/report/extraction/header'));
vi.mock(import('~/models/report/extraction/items'));

describe('validate report from stream', () => {
  it('should write file into temp dir', async () => {
    expect.hasAssertions();
    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    await validateReport(stream, { release: '5.1', reportId: 'ir' });

    expect(createWriteStream).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining(appConfig.temp.dir),
      'utf8'
    );
  });

  it('should validate header', async () => {
    expect.hasAssertions();
    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    await validateReport(stream, { release: '5.1', reportId: 'ir' });

    expect(extractReportHeader).toHaveBeenCalledOnce();
  });

  it('should validate items', async () => {
    expect.hasAssertions();
    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    await validateReport(stream, { release: '5.1', reportId: 'ir' });

    expect(extractReportItems).toHaveBeenCalledOnce();
  });

  it('should delete temporary report', async () => {
    expect.hasAssertions();
    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    await validateReport(stream, { release: '5.1', reportId: 'ir' });

    expect(unlink).toHaveBeenCalledOnce();
  });

  it('should return validation errors', async () => {
    expect.hasAssertions();
    vi.mocked(extractReportHeader).mockImplementationOnce(() => {
      validate({});
      throw new Error('Validation error', {
        cause: { validation: validate.errors },
      });
    });

    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    const result = await validateReport(stream, {
      release: '5.1',
      reportId: 'ir',
    });

    expect(result).toHaveProperty('header.valid', false);
    expect(result).toHaveProperty(
      'header.errors[0].message',
      "must have required property 'Report_Name'"
    );
  });

  it('should return basic errors', async () => {
    expect.hasAssertions();
    vi.mocked(extractReportHeader).mockRejectedValueOnce('Unknown error');

    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    const result = await validateReport(stream, {
      release: '5.1',
      reportId: 'ir',
    });

    expect(result).toHaveProperty('header.valid', false);
    expect(result).toHaveProperty('header.errors[0].message', 'Unknown error');
  });

  it('should return generic errors', async () => {
    expect.hasAssertions();
    vi.mocked(extractReportItems).mockImplementationOnce(
      async function* dummy() {
        yield { item: {} as COUNTERReportItem };
        throw new Error('Unknown error');
      }
    );

    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    const result = await validateReport(stream, {
      release: '5.1',
      reportId: 'ir',
    });

    expect(result).toHaveProperty('items.valid', false);
    expect(result).toHaveProperty('items.errors[0].message', 'Unknown error');
  });

  it('should throw if unable to cache report', async () => {
    expect.hasAssertions();
    vi.mocked(mkdir).mockRejectedValueOnce(new Error('Folder error'));

    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    const promise = validateReport(stream, {
      release: '5.1',
      reportId: 'ir',
    });

    await expect(promise).rejects.toThrow('Folder error');
    expect(unlink).toHaveBeenCalledOnce();
    stream.destroy();
  });
});
