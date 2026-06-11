import { describe, expect, test, vi } from 'vitest';

import { IRReportHeader as validate } from '@ezcounter/counter/schemas/r51';

import { appConfig } from '~/lib/__mocks__/config';
import {
  createReadStream,
  createWriteStream,
  mkdir,
  unlink,
} from '~/lib/__mocks__/fs';

import type { COUNTERReportItem } from '../dto';
import { validateReport } from '.';
import { extractReportHeader } from '../harvest/steps/extract/__mocks__/header';
import { extractReportItems } from '../harvest/steps/extract/items/__mocks__';

vi.mock(import('../harvest/steps/extract/header'));
vi.mock(import('../harvest/steps/extract/items'));

describe('Validate report from stream (validateReport)', () => {
  test('should write file into temp dir', async () => {
    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    await validateReport(stream, { release: '5.1', reportId: 'ir' });

    expect(createWriteStream).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining(appConfig.temp.dir),
      'utf8'
    );
  });

  test('should validate header', async () => {
    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    await validateReport(stream, { release: '5.1', reportId: 'ir' });

    expect(extractReportHeader).toHaveBeenCalledOnce();
  });

  test('should validate items', async () => {
    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    await validateReport(stream, { release: '5.1', reportId: 'ir' });

    expect(extractReportItems).toHaveBeenCalledOnce();
  });

  test('should delete temporary report', async () => {
    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    await validateReport(stream, { release: '5.1', reportId: 'ir' });

    expect(unlink).toHaveBeenCalledOnce();
  });

  test('should return validation errors', async () => {
    extractReportHeader.mockImplementationOnce(() => {
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

  test('should return basic errors', async () => {
    extractReportHeader.mockRejectedValueOnce('Unknown error');

    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    const result = await validateReport(stream, {
      release: '5.1',
      reportId: 'ir',
    });

    expect(result).toHaveProperty('header.valid', false);
    expect(result).toHaveProperty('header.errors[0].message', 'Unknown error');
  });

  test('should return generic errors', async () => {
    extractReportItems.mockImplementationOnce(async function* dummy() {
      yield { item: {} as COUNTERReportItem };
      throw new Error('Unknown error');
    });

    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    const result = await validateReport(stream, {
      release: '5.1',
      reportId: 'ir',
    });

    expect(result).toHaveProperty('items.valid', false);
    expect(result).toHaveProperty('items.errors[0].message', 'Unknown error');
  });

  test('should throw if unable to cache report', async () => {
    mkdir.mockRejectedValueOnce(new Error('Folder error'));

    const stream = createReadStream('/examples/reports/5.1/ir/valid.json');

    const promise = validateReport(stream, {
      release: '5.1',
      reportId: 'ir',
    });

    await expect(promise).rejects.toThrow('Folder error');
    expect(unlink).toHaveBeenCalled();
    stream.destroy();
  });
});
