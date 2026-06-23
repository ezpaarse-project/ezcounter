import { readFileSync } from 'node:fs';
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
  const readExampleFile = (file: string): R5ReportItem =>
    JSON.parse(readFileSync(join(EXAMPLES_DIR, '5', file), 'utf8')).item;

  describe('extract DOI', () => {
    it('should return undefined if release is unknown', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getDOIOfItem(item, 'foobar');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Print ISSN', () => {
    it('should return undefined if release is unknown', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, 'foobar');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Online ISSN', () => {
    it('should return undefined if release is unknown', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, 'foobar');

      expect(result).toBeUndefined();
    });
  });
});

describe('counter 5', () => {
  const readExampleFile = (file: string): R51ReportItem =>
    JSON.parse(readFileSync(join(EXAMPLES_DIR, '5', file), 'utf8')).item;

  describe('extract DOI', () => {
    it('should return DOI', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5');

      expect(result).toBe('10.9999/xxxxi05');
    });

    it('should return undefined if not available', () => {
      expect.hasAssertions();
      const item = readExampleFile('pr.json');

      const result = getDOIOfItem(item, '5');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Print ISSN', () => {
    it('should return Print ISSN', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5');

      expect(result).toBe('0931-865');
    });

    it('should return undefined if not available', () => {
      expect.hasAssertions();
      const item = readExampleFile('pr.json');

      const result = getPrintISSNOfItem(item, '5');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Online ISSN', () => {
    it('should return Online ISSN', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5');

      expect(result).toBe('0931-86x');
    });

    it('should return undefined if not available', () => {
      expect.hasAssertions();
      const item = readExampleFile('pr.json');

      const result = getOnlineISSNOfItem(item, '5');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });
  });
});

describe('counter 5.1', () => {
  const readExampleFile = (file: string): R51ReportItem =>
    JSON.parse(readFileSync(join(EXAMPLES_DIR, '5.1', file), 'utf8')).item;

  describe('extract DOI', () => {
    it('should return DOI', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5.1');

      expect(result).toBe('10.9999/xxxxi05');
    });

    it('should return undefined if not available', () => {
      expect.hasAssertions();
      const item = readExampleFile('pr.json');

      const result = getDOIOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Print ISSN', () => {
    it('should return Print ISSN', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5.1');

      expect(result).toBe('0931-865');
    });

    it('should return undefined if not available', () => {
      expect.hasAssertions();
      const item = readExampleFile('pr.json');

      const result = getPrintISSNOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5');

      expect(result).toBeUndefined();
    });
  });

  describe('extract Online ISSN', () => {
    it('should return Online ISSN', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5.1');

      expect(result).toBe('0931-86x');
    });

    it('should return undefined if not available', () => {
      expect.hasAssertions();
      const item = readExampleFile('pr.json');

      const result = getOnlineISSNOfItem(item, '5.1');

      expect(result).toBeUndefined();
    });

    it('should return undefined if wrong COUNTER version', () => {
      expect.hasAssertions();
      const item = readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5');

      expect(result).toBeUndefined();
    });
  });
});
