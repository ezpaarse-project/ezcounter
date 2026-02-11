import type { Readable } from 'node:stream';

import type { ValidateFunction } from '@ezcounter/models/lib/ajv';
import type { HarvestDownloadOptions } from '@ezcounter/models/harvest';

import type { RawReportItem, RawReportItemParent } from '../../../types';
import { getCounterValidation } from '../../validate';

import { createR5ReportStream, type R5StreamedValue } from './r5';
import { createR51ReportStream, type R51StreamedValue } from './r51';

type StreamedValue = R5StreamedValue & R51StreamedValue;

/**
 * Create a stream that will extract Items from a COUNTER Report
 *
 * @param report - Information about report
 * @param signal - The signal
 *
 * @returns A stream emitting items
 */
function createReportStream(
  report: { path: string; id: string; release: '5' | '5.1' },
  signal?: AbortSignal
): Readable {
  switch (report.release) {
    case '5.1':
      return createR51ReportStream(report, signal);
    case '5':
      return createR5ReportStream(report, signal);
    default:
      throw new Error(`COUNTER Release ${report.release} is unknown`);
  }
}

/**
 * Assert if Item is valid
 *
 * @param item - The value
 * @param validate - The validate function
 * @param ctx - Additional context to add to error
 */
function isItem(
  item: unknown,
  validate: ValidateFunction | undefined,
  ctx: Record<string, unknown> = {}
): asserts item is RawReportItem {
  if (!validate || validate(item)) {
    return;
  }

  throw new Error('Item is invalid', {
    cause: {
      validation: validate.errors,
      ...ctx,
    },
  });
}

/**
 * Assert if Parent is valid
 *
 * @param parent - The value
 * @param validate - The validate function
 * @param ctx - Additional context to add to error
 */
function isParent(
  parent: unknown,
  validate: ValidateFunction | undefined,
  ctx: Record<string, unknown> = {}
): asserts parent is RawReportItemParent {
  // Consider empty objects as undefined
  const value = parent && Object.keys(parent).length > 0 ? parent : undefined;

  if (!value || !validate || validate(value)) {
    return;
  }

  throw new Error('Item_Parent is invalid', {
    cause: {
      validation: validate.errors,
      ...ctx,
    },
  });
}

/**
 * Extract Report_Items from file
 *
 * @param reportPath - The path to report
 * @param options - Options to harvest
 *
 * @returns Iterator that will return every item found
 */
export async function* extractReportItems(
  reportPath: string,
  options: HarvestDownloadOptions,
  signal?: AbortSignal
): AsyncGenerator<{ item: RawReportItem; parent?: RawReportItemParent }> {
  const reportId = options.report.reportId.toUpperCase();
  const { item: validateItem, parent: validateParent } = getCounterValidation(
    options.report.release,
    reportId
  );

  const stream = createReportStream(
    { path: reportPath, id: reportId, release: options.report.release },
    signal
  );

  let hasItem = false;

  for await (const data of stream) {
    signal?.throwIfAborted();

    const { item, parent } = data as StreamedValue;

    const ctx = { itemKey: item.key, parentKey: parent?.key };
    isItem(item.value, validateItem, ctx);
    isParent(parent?.value, validateParent, ctx);

    yield { item: item.value, parent: parent?.value };
  }

  if (!hasItem) {
    throw new Error("Report doesn't have any Items");
  }
}
