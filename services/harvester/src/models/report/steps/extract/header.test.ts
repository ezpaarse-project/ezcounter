import { describe, expect, test } from 'vitest';

import type { HarvestDownloadOptions } from '@ezcounter/models/harvest';
import type { IRReportHeader } from '@ezcounter/models/counter/r51';
import type { SUSHIReportHeader } from '@ezcounter/models/counter/r5';

import { extractReportHeader, extractRegistryId } from './header';

describe('COUNTER 5', () => {
  const OPTIONS: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    report: {
      period: { start: '', end: '' },
      id: 'ir',
      release: '5',
    },
  };

  describe('Report Header (extractReportHeader)', () => {
    test('should return header', async () => {
      const header = await extractReportHeader(
        '/examples/5/ir/valid.json',
        OPTIONS
      );

      expect(header).toMatchObject({
        Report_ID: 'IR',
        Release: '5',
      });
    });

    test("should throw if release doesn't match", async () => {
      const promise = extractReportHeader(
        '/examples/5.1/ir/empty.json',
        OPTIONS
      );

      await expect(promise).rejects.toThrow('Expected Release 5, got 5.1');
    });

    test("should throw if id doesn't match", async () => {
      const promise = extractReportHeader('/examples/5/pr/valid.json', OPTIONS);

      await expect(promise).rejects.toThrow('Expected Report_ID IR, got PR');
    });

    test('should throw if no header is found', async () => {
      const promise = extractReportHeader(
        '/examples/5/ir/missing_header.json',
        OPTIONS
      );

      await expect(promise).rejects.toThrow(
        'Report_Header was not in downloaded report'
      );
    });

    test('should throw if header is invalid', async () => {
      const promise = extractReportHeader(
        '/examples/5/ir/invalid_header.json',
        OPTIONS
      );

      await expect(promise).rejects.toThrow('Report_Header is invalid');
      await expect(promise).rejects.toHaveProperty('cause.validation');
    });

    test("shouldn't throw if header is invalid and validation doesn't exists", async () => {
      const options = {
        ...OPTIONS,
        report: {
          ...OPTIONS.report,
          id: 'custom:ir',
        },
      };

      const promise = extractReportHeader(
        '/examples/5/custom:ir/invalid_header.json',
        options
      );

      await expect(promise).resolves.not.toThrow();
    });

    test('should throw if not JSON', async () => {
      const promise = extractReportHeader(
        '/examples/5/ir/invalid.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrow(
        'Parser cannot parse input: expected a value'
      );
    });

    test("should throw if doesn't exists", async () => {
      const promise = extractReportHeader(
        '/examples/5/ir/does-not-exists.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrow('no such file or directory');
      await expect(promise).rejects.toHaveProperty('code', 'ENOENT');
    });

    test('should be able to be aborted', async () => {
      const controller = new AbortController();

      const promise = extractReportHeader(
        '/examples/5/ir/valid.json',
        OPTIONS,
        controller.signal
      );

      controller.abort();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });
  });

  describe('Registry ID (extractRegistryId)', () => {
    const HEADER: SUSHIReportHeader = {
      Created: '2016-09-08T22:47:31Z',
      Created_By: 'EBSCO Informtion Services',
      Customer_ID: '12345',
      Report_ID: 'IR',
      Release: '5',
      Report_Name: 'Journal Requests (Excluding "OA_Gold")',
      Institution_Name: 'Mt. Laurel University',
      Institution_ID: [
        {
          Type: 'ISNI',
          Value: '1234 1234 1234 1234',
        },
      ],
      Report_Filters: [
        {
          Name: 'Begin_Date',
          Value: '2015-01-01',
        },
      ],
      Report_Attributes: [
        {
          Name: 'Attributes_To_Show',
          Value: 'Data_Type|Access_Method',
        },
      ],
      Exceptions: [
        {
          Code: 3031,
          Severity: 'Warning',
          Message: 'Usage Not Ready for Requested Dates',
          Help_URL: 'string',
          Data: 'Request was for 2016-01-01 to 2016-12-31; however, usage is only available to 2016-08-31.',
        },
      ],
    };

    test('should return null if unable to parse', () => {
      const id = extractRegistryId({
        ...HEADER,
        Registry_Record: undefined,
      });

      expect(id).toBe(null);
    });
  });
});

describe('COUNTER 5.1', () => {
  const OPTIONS: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    report: {
      period: { start: '', end: '' },
      id: 'ir',
      release: '5.1',
    },
  };

  describe('Report Header (extractReportHeader)', () => {
    test('should return header', async () => {
      const header = await extractReportHeader(
        '/examples/5.1/ir/valid.json',
        OPTIONS
      );

      expect(header).toMatchObject({
        Report_ID: 'IR',
        Release: '5.1',
      });
    });

    test("should throw if release doesn't match", async () => {
      const promise = extractReportHeader('/examples/5/ir/empty.json', OPTIONS);

      await expect(promise).rejects.toThrow('Expected Release 5.1, got 5');
    });

    test("should throw if id doesn't match", async () => {
      const promise = extractReportHeader(
        '/examples/5.1/pr/valid.json',
        OPTIONS
      );

      await expect(promise).rejects.toThrow('Expected Report_ID IR, got PR');
    });

    test('should throw if no header is found', async () => {
      const promise = extractReportHeader(
        '/examples/5.1/ir/missing_header.json',
        OPTIONS
      );

      await expect(promise).rejects.toThrow(
        'Report_Header was not in downloaded report'
      );
    });

    test('should throw if header is invalid', async () => {
      const promise = extractReportHeader(
        '/examples/5.1/ir/invalid_header.json',
        OPTIONS
      );

      await expect(promise).rejects.toThrow('Report_Header is invalid');
      await expect(promise).rejects.toHaveProperty('cause.validation');
    });

    test("shouldn't throw if header is invalid and validation doesn't exists", async () => {
      const options = {
        ...OPTIONS,
        report: {
          ...OPTIONS.report,
          id: 'custom:ir',
        },
      };

      const promise = extractReportHeader(
        '/examples/5.1/custom:ir/invalid_header.json',
        options
      );

      await expect(promise).resolves.not.toThrow();
    });

    test('should throw if not JSON', async () => {
      const promise = extractReportHeader(
        '/examples/5.1/ir/invalid.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrow(
        'Parser cannot parse input: expected a value'
      );
    });

    test("should throw if doesn't exists", async () => {
      const promise = extractReportHeader(
        '/examples/5.1/ir/does-not-exists.json.txt',
        OPTIONS
      );

      await expect(promise).rejects.toThrow('no such file or directory');
      await expect(promise).rejects.toHaveProperty('code', 'ENOENT');
    });

    test('should be able to be aborted', async () => {
      const controller = new AbortController();

      const promise = extractReportHeader(
        '/examples/5.1/ir/valid.json',
        OPTIONS,
        controller.signal
      );

      controller.abort();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });
  });

  describe('Registry ID (extractRegistryId)', () => {
    const ID = '99999999-9999-9999-9999-999999999999';
    const HEADER: IRReportHeader = {
      Release: '5.1',
      Report_ID: 'IR',
      Report_Name: 'Item Report',
      Created: '2023-02-15T09:11:12Z',
      Created_By: 'Sample Publisher',
      Institution_ID: {
        ISNI: ['1234123412341234'],
      },
      Institution_Name: 'Sample Institution',
      Registry_Record: `https://registry.countermetrics.org/platform/${ID}`,
      Report_Filters: {
        Begin_Date: '2022-01-01',
        End_Date: '2022-03-31',
      },
    };

    test('should return ID from Registry_Record', () => {
      const id = extractRegistryId(HEADER);

      expect(id).toBe(ID);
    });

    test('should return null if unable to parse', () => {
      const id = extractRegistryId({
        ...HEADER,
        Registry_Record: undefined,
      });

      expect(id).toBe(null);
    });
  });
});
