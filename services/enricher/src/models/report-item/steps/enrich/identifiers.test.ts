import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import type { R51ReportItem, R5ReportItem } from '@ezcounter/counter/dto';

import {
  getDOIOfItem,
  getOnlineISSNOfItem,
  getPrintISSNOfItem,
} from './identifiers';

const EXAMPLES_DIR = join(process.cwd(), '__tests__/examples/items/');

describe('counter unknown', () => {
  const readExampleFile = async (file: string): Promise<R5ReportItem> =>
    JSON.parse(await readFile(join(EXAMPLES_DIR, '5', file), 'utf8')).item;

  describe('extract DOI', () => {
    it('should return undefined if release is unknown', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getDOIOfItem(item, 'foobar');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Print ISSN', () => {
    it('should return undefined if release is unknown', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, 'foobar');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Online ISSN', () => {
    it('should return undefined if release is unknown', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, 'foobar');

      expect(result).toBeUndefined();
    });
  });
});

describe('counter 5', () => {
  const readExampleFile = async (file: string): Promise<R51ReportItem> =>
    JSON.parse(await readFile(join(EXAMPLES_DIR, '5', file), 'utf8')).item;

  describe('extract DOI', () => {
    it('should return DOI', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5');

      expect(result).toBe('10.9999/xxxxi05');
    });

    it('should return undefined if not available', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('pr.json');

      const result = getDOIOfItem(item, '5');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Print ISSN', () => {
    it('should return Print ISSN', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5');

      expect(result).toBe('0931-865');
    });

    it('should return undefined if not available', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('pr.json');

      const result = getPrintISSNOfItem(item, '5');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Online ISSN', () => {
    it('should return Online ISSN', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5');

      expect(result).toBe('0931-86x');
    });

    it('should return undefined if not available', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('pr.json');

      const result = getOnlineISSNOfItem(item, '5');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });
  });
});

describe('counter 5.1', () => {
  const readExampleFile = async (file: string): Promise<R51ReportItem> =>
    JSON.parse(await readFile(join(EXAMPLES_DIR, '5.1', file), 'utf8')).item;

  describe('extract DOI', () => {
    it('should return DOI', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5.1');

      expect(result).toBe('10.9999/xxxxi05');
    });

    it('should return undefined if not available', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('pr.json');

      const result = getDOIOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Print ISSN', () => {
    it('should return Print ISSN', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5.1');

      expect(result).toBe('0931-865');
    });

    it('should return undefined if not available', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('pr.json');

      const result = getPrintISSNOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Online ISSN', () => {
    it('should return Online ISSN', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5.1');

      expect(result).toBe('0931-86x');
    });

    it('should return undefined if not available', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('pr.json');

      const result = getOnlineISSNOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', async () => {
      expect.hasAssertions();
      const item = await readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5');

      expect(result).toBeUndefined();
    });
  });
});
