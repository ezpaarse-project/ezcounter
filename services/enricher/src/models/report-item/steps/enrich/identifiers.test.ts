import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, test } from 'vitest';

import type { R51ReportItem, R5ReportItem } from '@ezcounter/counter/dto';

import {
  getDOIOfItem,
  getOnlineISSNOfItem,
  getPrintISSNOfItem,
} from './identifiers';

const EXAMPLES_DIR = join(process.cwd(), '__tests__/examples/items/');

describe('COUNTER unknown', () => {
  const readExampleFile = (file: string): R5ReportItem =>
    JSON.parse(readFileSync(join(EXAMPLES_DIR, '5', file), 'utf8')).item;

  describe('Extract DOI (getDOIOfItem)', () => {
    test('should return undefined if release is unknown', () => {
      const item = readExampleFile('ir.json');

      const result = getDOIOfItem(item, 'foobar');

      expect(result).toBe(undefined);
    });
  });

  describe('Extract Print ISSN (getPrintISSNOfItem)', () => {
    test('should return undefined if release is unknown', () => {
      const item = readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, 'foobar');

      expect(result).toBe(undefined);
    });
  });

  describe('Extract Online ISSN (getOnlineISSNOfItem)', () => {
    test('should return undefined if release is unknown', () => {
      const item = readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, 'foobar');

      expect(result).toBe(undefined);
    });
  });
});

describe('COUNTER 5', () => {
  const readExampleFile = (file: string): R51ReportItem =>
    JSON.parse(readFileSync(join(EXAMPLES_DIR, '5', file), 'utf8')).item;

  describe('Extract DOI (getDOIOfItem)', () => {
    test('should return DOI', () => {
      const item = readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5');

      expect(result).toBe('10.9999/xxxxi05');
    });

    test('should return undefined if not available', () => {
      const item = readExampleFile('pr.json');

      const result = getDOIOfItem(item, '5');

      expect(result).toBe(undefined);
    });

    test('should return undefined if wrong COUNTER version', () => {
      const item = readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5.1');

      expect(result).toBe(undefined);
    });
  });

  describe('Extract Print ISSN (getPrintISSNOfItem)', () => {
    test('should return Print ISSN', () => {
      const item = readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5');

      expect(result).toBe('0931-865');
    });

    test('should return undefined if not available', () => {
      const item = readExampleFile('pr.json');

      const result = getPrintISSNOfItem(item, '5');

      expect(result).toBe(undefined);
    });

    test('should return undefined if wrong COUNTER version', () => {
      const item = readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5.1');

      expect(result).toBe(undefined);
    });
  });

  describe('Extract Online ISSN (getOnlineISSNOfItem)', () => {
    test('should return Online ISSN', () => {
      const item = readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5');

      expect(result).toBe('0931-86x');
    });

    test('should return undefined if not available', () => {
      const item = readExampleFile('pr.json');

      const result = getOnlineISSNOfItem(item, '5');

      expect(result).toBe(undefined);
    });

    test('should return undefined if wrong COUNTER version', () => {
      const item = readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5.1');

      expect(result).toBe(undefined);
    });
  });
});

describe('COUNTER 5.1', () => {
  const readExampleFile = (file: string): R51ReportItem =>
    JSON.parse(readFileSync(join(EXAMPLES_DIR, '5.1', file), 'utf8')).item;

  describe('Extract DOI (getDOIOfItem)', () => {
    test('should return DOI', () => {
      const item = readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5.1');

      expect(result).toBe('10.9999/xxxxi05');
    });

    test('should return undefined if not available', () => {
      const item = readExampleFile('pr.json');

      const result = getDOIOfItem(item, '5.1');

      expect(result).toBe(undefined);
    });

    test('should return undefined if wrong COUNTER version', () => {
      const item = readExampleFile('ir.json');

      const result = getDOIOfItem(item, '5');

      expect(result).toBe(undefined);
    });
  });

  describe('Extract Print ISSN (getPrintISSNOfItem)', () => {
    test('should return Print ISSN', () => {
      const item = readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5.1');

      expect(result).toBe('0931-865');
    });

    test('should return undefined if not available', () => {
      const item = readExampleFile('pr.json');

      const result = getPrintISSNOfItem(item, '5.1');

      expect(result).toBe(undefined);
    });

    test('should return undefined if wrong COUNTER version', () => {
      const item = readExampleFile('ir.json');

      const result = getPrintISSNOfItem(item, '5');

      expect(result).toBe(undefined);
    });
  });

  describe('Extract Online ISSN (getOnlineISSNOfItem)', () => {
    test('should return Online ISSN', () => {
      const item = readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5.1');

      expect(result).toBe('0931-86x');
    });

    test('should return undefined if not available', () => {
      const item = readExampleFile('pr.json');

      const result = getOnlineISSNOfItem(item, '5.1');

      expect(result).toBe(undefined);
    });

    test('should return undefined if wrong COUNTER version', () => {
      const item = readExampleFile('ir.json');

      const result = getOnlineISSNOfItem(item, '5');

      expect(result).toBe(undefined);
    });
  });
});
