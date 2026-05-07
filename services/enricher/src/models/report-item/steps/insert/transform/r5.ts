import { createHash } from 'node:crypto';

import {
  format,
  isFirstDayOfMonth,
  isLastDayOfMonth,
  isSameMonth,
} from 'date-fns';
import isbn from 'isbn3';

import type { R5ReportItem } from '@ezcounter/counter/dto';
import type {
  COUNTERItemIdentifiers as R5ItemID,
  SUSHIReportHeader as R5ReportHeader,
  COUNTERItemParent as R5ReportItemParent,
  COUNTERItemPerformance as R5ReportItemPerformance,
} from '@ezcounter/counter/schemas/r5';
import type { HarvestInsertOptions } from '@ezcounter/dto/harvest';

import type {
  CreateR5Document,
  CreateR5DocumentHeader,
  CreateR5DocumentItem,
  CreateR5DocumentParent,
} from '~/models/counter-document/dto';

/**
 * Transform a list of attributes into an object
 *
 * @param list - List of attributes
 * @param options - Options
 *
 * @returns Object representation of the list where each type becomes a property
 */
function list2object(
  list: ({ Type: string; Value: string } | { Name: string; Value: string })[],
  options: { splitValuesBy?: string } = {}
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const el of list) {
    let value = [el.Value];
    if (options.splitValuesBy && typeof el.Value === 'string') {
      value = el.Value.split(options.splitValuesBy);
    }

    const key = 'Name' in el ? el.Name : el.Type;
    result[key] = [...(result[key] || []), ...value];
  }

  return result;
}

/**
 * Format Item_ID into human readable entries
 *
 * @param ids - The Item_ID object
 *
 * @returns A human readable Item_ID
 */
const formatItemID = (ids: R5ItemID[]): R5ItemID[] =>
  ids
    .map((item) => {
      switch (item.Type) {
        case 'ISBN':
          // We want to show the hyphened version of ISBN13
          return { ...item, Value: isbn.asIsbn13(item.Value, true) || '' };

        case 'Online_ISSN':
        case 'Print_ISSN':
          // We want to uppercase the trailing X
          return { ...item, Value: item.Value.toUpperCase() };

        default:
          return item;
      }
    })
    .filter((id) => id.Value !== '');

/**
 * Generate unique ID based on data
 *
 * @param parts - The parts of the ID
 * @param itemIdentifiers - The identifiers of the item
 *
 * @returns The generated ID
 */
const generateId = (
  parts: string[],
  itemIdentifiers: (string | undefined)[]
): string =>
  [
    ...parts,
    createHash('sha256').update(itemIdentifiers.join('|')).digest('hex'),
  ].join(':');

/**
 * Transform COUNTER 5 header from report into a COUNTER Document Header
 *
 * @param header - The 5 header
 *
 * @returns The transformed header
 */
const transformHeader = (header: R5ReportHeader): CreateR5DocumentHeader => ({
  Created: header.Created ?? undefined,

  Created_By: header.Created_By ?? undefined,

  Customer_ID: header.Customer_ID,

  Institution_ID: header.Institution_ID && list2object(header.Institution_ID),

  Institution_Name: header.Institution_Name ?? undefined,

  Release: header.Release ?? undefined,

  Report_Attributes:
    header.Report_Attributes &&
    list2object(header.Report_Attributes, {
      splitValuesBy: '|',
    }),

  Report_Filters: list2object(header.Report_Filters),

  Report_ID: header.Report_ID,

  Report_Name: header.Report_Name ?? undefined,
});

/**
 * Transform COUNTER 5 parent from report into a COUNTER Document Parent
 *
 * @param parent - The 5 parent
 *
 * @returns The transformed parent
 */
const transformParent = (
  parent: R5ReportItemParent
): CreateR5DocumentParent => ({
  Data_Type: parent.Data_Type,

  Item_Attributes:
    parent.Item_Attributes && list2object(parent.Item_Attributes),

  Item_Contributors: parent.Item_Contributors,

  Item_Dates: parent.Item_Dates && list2object(parent.Item_Dates),

  Item_ID: list2object(formatItemID(parent.Item_ID)),

  Item_Name: parent.Item_Name,
});

/**
 * Transform COUNTER 5 item from report into a COUNTER Document item
 *
 * @param item - The 5 item
 *
 * @returns The transformed item
 */
const transformItem = (item: R5ReportItem): CreateR5DocumentItem => ({
  Access_Method: item.Access_Method,

  Access_Type: 'Access_Type' in item ? item.Access_Type : undefined,

  Data_Type: item.Data_Type,

  Database: 'Database' in item && item.Database ? item.Database : undefined,

  Item: 'Item' in item ? item.Item : undefined,

  Item_Attributes:
    'Item_Attributes' in item && item.Item_Attributes
      ? list2object(item.Item_Attributes)
      : undefined,

  Item_Contributors:
    'Item_Contributors' in item ? item.Item_Contributors : undefined,

  Item_Dates:
    'Item_Dates' in item && item.Item_Dates
      ? list2object(item.Item_Dates)
      : undefined,

  Item_ID:
    'Item_ID' in item && item.Item_ID
      ? list2object(formatItemID(item.Item_ID))
      : undefined,

  Platform: item.Platform ?? undefined,

  Publisher: 'Publisher' in item && item.Publisher ? item.Publisher : undefined,

  Publisher_ID:
    'Publisher_ID' in item && item.Publisher_ID
      ? list2object(item.Publisher_ID)
      : undefined,

  Section_Type: 'Section_Type' in item ? item.Section_Type : undefined,

  Title: 'Title' in item && item.Title ? item.Title : undefined,

  YOP: 'YOP' in item ? item.YOP : undefined,
});

/**
 * Get identifiers specific to item
 *
 * @param item - The item
 *
 * @returns The identifiers
 */
const getIdentifiers = (item: CreateR5DocumentItem): (string | undefined)[] => [
  item.YOP,
  item.Access_Method,
  item.Access_Type,
  item.Data_Type,
  item.Platform,
  item.Publisher,
  item.Title,
  item.Database,
  ...Object.entries(item.Item_ID ?? {})
    .map(([key, value]) => `${key}:${value}`)
    .toSorted(),
];

/**
 * Get the date of an item performance
 *
 * @param performance - The item performance
 * @param identifiers - The identifiers of the item (used to add detail on errors)
 *
 * @returns - The date of the item performance (format: yyyy-MM)
 */
function getPerformanceDate(performance: R5ReportItemPerformance): string {
  const start = new Date(performance.Period.Begin_Date);
  const end = new Date(performance.Period.End_Date);

  const beginDate = format(start, 'yyyy-MM');
  const endDate = format(end, 'yyyy-MM');

  if (!isSameMonth(start, end)) {
    throw new Error('Performance cover more than a month', {
      cause: { beginDate, endDate },
    });
  }

  if (!isFirstDayOfMonth(start) || !isLastDayOfMonth(end)) {
    throw new Error('Performance does not cover the entire month', {
      cause: { beginDate, endDate },
    });
  }

  return beginDate;
}

export type R5ReportData = {
  harvestDate: string;
  header: R5ReportHeader;
  item: R5ReportItem;
};

/**
 * Transform COUNTER 5 data from report into a COUNTER Document
 *
 * @param data - The COUNTER data
 * @param options - The options to use when inserting the documents
 *
 * @yields The transformed documents with their id
 */
export function* transformR5ItemToDocuments(
  data: R5ReportData,
  options: HarvestInsertOptions
): Generator<{ document: CreateR5Document; id: string }> {
  const reportId = data.header.Report_ID.toLowerCase();

  const header = transformHeader(data.header);
  const item = transformItem(data.item);
  const parent =
    'Item_Parent' in data.item && data.item.Item_Parent
      ? transformParent(data.item.Item_Parent)
      : undefined;

  const identifiers = getIdentifiers(item);

  for (const performance of data.item.Performance) {
    const date = getPerformanceDate(performance);

    for (const { Metric_Type, Count } of performance.Instance) {
      const metricType = Metric_Type.toLowerCase();

      yield {
        document: {
          ...item,
          Count,
          Item_Parent: parent,
          Metric_Type,
          Report_Header: header,
          X_Date_Month: date,
          X_Harvested_At: data.harvestDate,
        },
        id: generateId(
          [date, reportId, metricType, ...(options.additionalIdParts ?? [])],
          identifiers
        ),
      };
    }
  }
}
