import type { Readable } from 'node:stream';

import type { ValidateFunction } from '@ezcounter/counter/schemas';
import type { HarvestDownloadOptions } from '@ezcounter/dto/harvest';

import type { COUNTERReportItem, COUNTERReportItemParent } from '../../../dto';
import { getCounterValidation } from '../../validate';
import { type R5StreamedValue, createR5ReportStream } from './r5';
import { type R51StreamedValue, createR51ReportStream } from './r51';

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
): asserts item is COUNTERReportItem {
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
): asserts parent is COUNTERReportItemParent {
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
 * @param signal - Signal to abort extraction
 *
 * @yields Each item found in the report
 */
export async function* extractReportItems(
  reportPath: string,
  options: HarvestDownloadOptions,
  signal?: AbortSignal
): AsyncGenerator<{
  item: COUNTERReportItem;
  parent?: COUNTERReportItemParent;
}> {
  const reportId = options.report.id.toUpperCase();

  const { item: validateItem, parent: validateParent } = getCounterValidation(
    options.report.release,
    reportId
  );

  const stream = createReportStream(
    { id: reportId, path: reportPath, release: options.report.release },
    signal
  );

  let hasItem = false;

  for await (const data of stream) {
    signal?.throwIfAborted();

    const { item, parent } = data as StreamedValue;

    const ctx = { itemKey: item.key, parentKey: parent?.key };
    isItem(item.value, validateItem, ctx);
    isParent(parent?.value, validateParent, ctx);
    hasItem = true;

    yield { item: item.value, parent: parent?.value };
  }

  if (!hasItem) {
    throw new Error("Report doesn't have any Items");
  }
}
