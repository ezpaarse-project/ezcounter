import { chain } from 'stream-chain';

import type { Readable } from 'node:stream';

import { createReadStream } from '~/lib/fs';
import {
  jsonParser,
  jsonPick,
  jsonStreamValues,
  jsonStreamArray,
  jsonIgnore,
  type JSONStreamedValue,
  type JSONToken,
} from '~/lib/stream/json';

import { HarvestLock } from '~/models/lock';

export type R51StreamedValue = {
  item: JSONStreamedValue;
  parent?: JSONStreamedValue;
};

/**
 * Initialize stream to extract Item_Parents from a COUNTER 5.1 Item Report
 *
 * @param reportPath - The path to report
 * @param itemsLock - Lock about Items Stream
 * @param parentsLock - Lock about Parents Stream (self)
 *
 * @returns A stream emitting Items
 */
function createR51IRParentStream(
  reportPath: string,
  itemsLock: HarvestLock,
  parentsLock: HarvestLock
): Readable {
  let hadItems = false;

  return chain([
    createReadStream(reportPath),
    jsonParser(),
    // Picking whole parent
    jsonPick({ filter: /^Report_Items\.\d+$/ }),
    // Check if have the "Items" property
    (token: JSONToken): JSONToken => {
      hadItems =
        hadItems || (token.name === 'keyValue' && token.value === 'Items');
      return token;
    },
    // Removing the Items property to save some memory
    jsonIgnore({ filter: 'Items' }),
    // Streaming next tokens as one value
    jsonStreamValues(),
    // Resolve Parent before resolving any item
    async (parent: JSONStreamedValue): Promise<JSONStreamedValue> => {
      if (!hadItems) {
        throw new Error("Parent doesn't have Items", {
          cause: { parentKey: parent.key },
        });
      }

      // Pause stream once parent is resolved
      hadItems = false;
      await parentsLock.waitForRelease();
      parentsLock.lock();
      itemsLock.release();

      return parent;
    },
  ]);
}

/**
 * Initialize stream to extract Items from a COUNTER 5.1 Item Report
 *
 * @param reportPath - The path to report
 * @param itemsLock - Lock about Items Stream (self)
 * @param parentsLock - Lock about Parents Stream
 *
 * @returns A stream emitting Items
 */
function createR51IRItemStream(
  reportPath: string,
  itemsLock: HarvestLock,
  parentsLock: HarvestLock
): Readable {
  let arrayLevel = 0;
  let parentKey = -1;
  let items = { had: false, expected: false };

  return chain([
    createReadStream(reportPath),
    jsonParser(),
    // Picking items
    jsonPick({ filter: /^Report_Items\.\d+\.Items$/ }),
    async (token: JSONToken): Promise<JSONToken> => {
      if (arrayLevel === 0) {
        // All items of current parent are resolved
        if (items.expected !== items.had) {
          throw new Error("A Parent_Item didn't had any item", {
            cause: { parentKey },
          });
        }
        items = { had: false, expected: false };

        await itemsLock.waitForRelease();
      }
      if (token.name === 'startArray') {
        arrayLevel += 1;
      }
      if (token.name === 'endArray') {
        arrayLevel -= 1;

        if (arrayLevel === 0) {
          items.expected = true;
          itemsLock.lock();
          parentsLock.release();
          parentKey += 1;
        }
      }

      return token;
    },
    // Streaming each value as a single event, while tracking if we had items resolved
    jsonStreamArray(),
    (item: JSONStreamedValue): JSONStreamedValue => {
      items.had = true;
      return item;
    },
  ]);
}

/**
 * Create a stream that will extract Items from a COUNTER 5.1 Item Report
 *
 * @param reportPath - The path to report
 * @param signal - The signal
 *
 * @returns A stream emitting items
 */
function createR51IRStream(reportPath: string, signal?: AbortSignal): Readable {
  const parentsLock = new HarvestLock(true);
  const itemsLock = new HarvestLock(true);

  let lastParent: JSONStreamedValue | undefined;
  // Streaming parents
  const parentsStream = chain(
    [
      createR51IRParentStream(reportPath, itemsLock, parentsLock),
      (parent: JSONStreamedValue): void => {
        lastParent = parent;
      },
    ],
    { signal }
  );

  // Streaming children
  const itemsStream = chain(
    [
      createR51IRItemStream(reportPath, itemsLock, parentsLock),
      (item: JSONStreamedValue): R51StreamedValue => ({
        item,
        parent: lastParent,
      }),
    ],
    { signal }
  );

  // Setup events
  parentsStream.on('error', (err) => {
    itemsStream.destroy(err);
  });
  itemsStream.on('error', (err) => {
    parentsStream.destroy(err);
  });
  itemsStream.on('end', () => {
    parentsStream.destroy();
  });

  parentsLock.release();
  return itemsStream;
}

/**
 * Create a stream that will extract Items from a COUNTER 5.1 Report
 *
 * @param report - Information about report
 * @param signal - The signal
 *
 * @returns A stream emitting items
 */
export function createR51ReportStream(
  report: { path: string; id: string },
  signal?: AbortSignal
): Readable {
  switch (report.id) {
    case 'IR':
    case 'IR_A1':
    case 'IR_M1':
      return createR51IRStream(report.path, signal);

    default:
      return chain(
        [
          createReadStream(report.path),
          jsonParser(),
          jsonPick({ filter: /^Report_Items$/ }),
          jsonStreamArray(),
          (item: JSONStreamedValue): R51StreamedValue => ({
            item,
          }),
        ],
        { signal }
      );
  }
}
