import { describe, expect, test } from 'vitest';

import type { HarvestDownloadOptions } from '@ezcounter/models/harvest';

import { extractReportItems } from '.';

describe('COUNTER 5', () => {
  const OPTIONS: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    report: {
      period: { start: '', end: '' },
      reportId: 'ir',
      release: '5',
    },
  };
  describe('Report Items (extractReportItems)', () => {
    test('should return iterator', async () => {
      const options = {
        ...OPTIONS,
        report: {
          ...OPTIONS.report,
          reportId: 'pr',
        },
      };

      const iterator = extractReportItems('/examples/5/pr/valid.json', options);

      const promise = iterator.next();

      await expect(promise).resolves.toHaveProperty('value');
    });

    test('should return iterator for IR', async () => {
      const iterator = extractReportItems('/examples/5/ir/valid.json', OPTIONS);

      const promise = iterator.next();

      await expect(promise).resolves.toHaveProperty('value');
    });

    test('should throw if an item is invalid', async () => {
      const iterator = extractReportItems(
        '/examples/5/ir/invalid_item.json',
        OPTIONS
      );

      const promise = iterator.next();

      await expect(promise).rejects.toThrow('Item is invalid');
      await expect(promise).rejects.toHaveProperty('cause.parentKey');
    });

    test("should throw if doesn't have items", async () => {
      const iterator = extractReportItems('/examples/5/ir/empty.json', OPTIONS);
      const promise = iterator.next();

      await expect(promise).rejects.toThrow("Report doesn't have any Items");
    });

    test("shouldn't throw if header is invalid from an unknown report", async () => {
      const options = {
        ...OPTIONS,
        report: {
          ...OPTIONS.report,
          reportId: 'custom:ir',
        },
      };

      const iterator = extractReportItems(
        '/examples/5/custom:ir/invalid_item.json',
        options
      );
      const promise = iterator.next();

      await expect(promise).resolves.not.toThrowError('Exception is invalid');
    });

    test('should throw if not JSON', async () => {
      const iterator = extractReportItems(
        '/examples/5/ir/invalid.json.txt',
        OPTIONS
      );
      const promise = iterator.next();

      await expect(promise).rejects.toThrow(
        'Parser cannot parse input: expected a value'
      );
    });

    test("should throw if doesn't exists", async () => {
      const iterator = extractReportItems(
        '/examples/5/ir/does-not-exists.json.txt',
        OPTIONS
      );
      const promise = iterator.next();

      await expect(promise).rejects.toThrow('no such file or directory');
      await expect(promise).rejects.toHaveProperty('code', 'ENOENT');
    });

    test('should be able to be aborted before first item', async () => {
      const controller = new AbortController();

      const iterator = extractReportItems(
        '/examples/5/ir/valid.json',
        OPTIONS,
        controller.signal
      );

      controller.abort();
      const promise = iterator.next();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });

    test('should be able to be aborted after first item', async () => {
      const controller = new AbortController();

      const iterator = extractReportItems(
        '/examples/5/ir/valid.json',
        OPTIONS,
        controller.signal
      );

      await iterator.next();
      const promise = iterator.next();
      controller.abort();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });
  });
});

describe('COUNTER 5.1', () => {
  const OPTIONS: HarvestDownloadOptions = {
    cacheKey: '',
    dataHost: { auth: {}, baseUrl: '' },
    report: {
      period: { start: '', end: '' },
      reportId: 'ir',
      release: '5.1',
    },
  };
  describe('Report Items (extractReportItems)', () => {
    test('should return iterator', async () => {
      const options = {
        ...OPTIONS,
        report: {
          ...OPTIONS.report,
          reportId: 'pr',
        },
      };

      const iterator = extractReportItems(
        '/examples/5.1/pr/valid.json',
        options
      );

      const promise = iterator.next();

      await expect(promise).resolves.toHaveProperty('value');
    });

    test('should return iterator for IR', async () => {
      const iterator = extractReportItems(
        '/examples/5.1/ir/valid.json',
        OPTIONS
      );

      const promise = iterator.next();

      await expect(promise).resolves.toHaveProperty('value');
    });

    test('should throw if an item is invalid', async () => {
      const iterator = extractReportItems(
        '/examples/5.1/ir/invalid_item.json',
        OPTIONS
      );

      const promise = iterator.next();

      await expect(promise).rejects.toThrow('Item is invalid');
      await expect(promise).rejects.toHaveProperty('cause.parentKey');
    });

    test('should throw if an item parent is invalid', async () => {
      const iterator = extractReportItems(
        '/examples/5.1/ir/invalid_parent.json',
        OPTIONS
      );
      const promise = iterator.next();

      await expect(promise).rejects.toThrow('Item_Parent is invalid');
      await expect(promise).rejects.toHaveProperty('cause.parentKey');
    });

    test("should throw if doesn't have items", async () => {
      const iterator = extractReportItems(
        '/examples/5.1/ir/empty.json',
        OPTIONS
      );
      const promise = iterator.next();

      await expect(promise).rejects.toThrow("Report doesn't have any Items");
    });

    test("should throw if an item parent doesn't have items", async () => {
      const iterator = extractReportItems(
        '/examples/5.1/ir/missing_items.json',
        OPTIONS
      );
      const promise = iterator.next();

      await expect(promise).rejects.toThrow("Parent doesn't have Items");
      await expect(promise).rejects.toHaveProperty('cause.parentKey');
    });

    test("should throw if an item parent doesn't have items", async () => {
      const iterator = extractReportItems(
        '/examples/5.1/ir/missing_items.json',
        OPTIONS
      );
      const promise = iterator.next();

      await expect(promise).rejects.toThrow("Parent doesn't have Items");
      await expect(promise).rejects.toHaveProperty('cause.parentKey');
    });

    test('should throw if an item parent have empty items', async () => {
      const iterator = extractReportItems(
        '/examples/5.1/ir/empty_items.json',
        OPTIONS
      );
      const promise = iterator.next();

      await expect(promise).rejects.toThrow(
        "A Parent_Item didn't had any item"
      );
      await expect(promise).rejects.toHaveProperty('cause.parentKey');
    });

    test("shouldn't throw if header is invalid from an unknown report", async () => {
      const options = {
        ...OPTIONS,
        report: {
          ...OPTIONS.report,
          reportId: 'custom:ir',
        },
      };

      const iterator = extractReportItems(
        '/examples/5.1/custom:ir/invalid_item.json',
        options
      );
      const promise = iterator.next();

      await expect(promise).resolves.not.toThrowError('Exception is invalid');
    });

    test('should throw if not JSON', async () => {
      const iterator = extractReportItems(
        '/examples/5.1/ir/invalid.json.txt',
        OPTIONS
      );
      const promise = iterator.next();

      await expect(promise).rejects.toThrow(
        'Parser cannot parse input: expected a value'
      );
    });

    test("should throw if doesn't exists", async () => {
      const iterator = extractReportItems(
        '/examples/5.1/ir/does-not-exists.json.txt',
        OPTIONS
      );
      const promise = iterator.next();

      await expect(promise).rejects.toThrow('no such file or directory');
      await expect(promise).rejects.toHaveProperty('code', 'ENOENT');
    });

    test('should be able to be aborted before first item', async () => {
      const controller = new AbortController();

      const iterator = extractReportItems(
        '/examples/5.1/ir/valid.json',
        OPTIONS,
        controller.signal
      );

      controller.abort();
      const promise = iterator.next();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });

    test('should be able to be aborted after first item', async () => {
      const controller = new AbortController();

      const iterator = extractReportItems(
        '/examples/5.1/ir/valid.json',
        OPTIONS,
        controller.signal
      );

      await iterator.next();
      const promise = iterator.next();
      controller.abort();

      await expect(promise).rejects.toThrow('The operation was aborted');
    });
  });
});
