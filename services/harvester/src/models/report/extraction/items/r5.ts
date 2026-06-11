import type { Readable } from 'node:stream';

import { chain } from 'stream-chain';

import { createReadStream } from '~/lib/fs';
import {
  type JSONStreamItem,
  jsonParser,
  jsonPick,
  jsonStreamArray,
} from '~/lib/stream/json';

export type R5StreamItem = {
  item: JSONStreamItem;
};

/**
 * Create a stream that will extract Items from a COUNTER 5 Report
 *
 * @param report - Information about report
 * @param signal - The signal
 *
 * @returns A stream emitting items
 */
export function createR5ReportStream(
  report: { path: string; id: string },
  signal?: AbortSignal
): Readable {
  return chain(
    [
      createReadStream(report.path),
      jsonParser(),
      jsonPick({ filter: /^Report_Items$/ }),
      jsonStreamArray(),
      (data: JSONStreamItem): R5StreamItem => ({
        item: data,
      }),
    ],
    { signal }
  );
}
