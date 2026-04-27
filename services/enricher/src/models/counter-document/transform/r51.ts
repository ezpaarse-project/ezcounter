import { createHash } from 'node:crypto';

import { format } from 'date-fns';
import { asIsbn13 } from 'isbn3';

import type {
  R51ReportHeader,
  R51ReportItem,
  R51ReportItemParent,
} from '@ezcounter/counter/dto';
import type { ItemID as R51ItemID } from '@ezcounter/counter/schemas/r51';
import type { HarvestInsertOptions } from '@ezcounter/dto/harvest';

import type {
  CreateR51Document,
  CreateR51DocumentAttribute,
  CreateR51DocumentHeader,
  CreateR51DocumentItem,
  CreateR51DocumentParent,
} from '../dto';

/**
 * Format Item_ID into human readable entries
 *
 * @param ids - The Item_ID object
 *
 * @returns A human readable Item_ID
 */
function formatItemID(ids: R51ItemID): R51ItemID {
  const result = { ...ids };

  if (ids?.ISBN) {
    // We want to show the hyphened version of ISBN13
    result.ISBN = asIsbn13(ids.ISBN, true) || undefined;
  }

  if (ids?.Online_ISSN) {
    // We want to uppercase the trailing X
    result.Online_ISSN = ids.Online_ISSN.toUpperCase();
  }
  if (ids?.Print_ISSN) {
    // We want to uppercase the trailing X
    result.Print_ISSN = ids.Print_ISSN.toUpperCase();
  }

  return result;
}

/**
 * Get identifiers specific to item
 *
 * @param ids - The Item_ID object
 *
 * @returns The identifiers
 */
const getIdentifiers = (ids: R51ItemID): string[] =>
  Object.entries(ids)
    .map(([key, value]) => `${key}:${value}`)
    .sort();

/**
 * Generate unique ID based on data
 *
 * @param parts - The parts of the ID
 * @param itemIdentifiers - The identifiers of the item
 *
 * @returns The generated ID
 */
const generateId = (parts: string[], itemIdentifiers: string[]): string =>
  [
    ...parts,
    createHash('sha256').update(itemIdentifiers.join('|')).digest('hex'),
  ].join(':');

/**
 * Transform COUNTER 5.1 header from report into a COUNTER Document Header
 *
 * @param header - The 5.1 header
 *
 * @returns The transformed header
 */
const transformHeader = (header: R51ReportHeader): CreateR51DocumentHeader => ({
  Created: header.Created,

  Created_By: header.Created_By,

  Institution_ID: header.Institution_ID,

  Institution_Name: header.Institution_Name,

  Release: header.Release,

  Report_Attributes:
    'Report_Attributes' in header ? header.Report_Attributes : undefined,

  Report_Filters: header.Report_Filters,

  Report_ID: header.Report_ID,

  Report_Name: header.Report_Name,
});

/**
 * Transform COUNTER 5.1 parent from report into a COUNTER Document Parent
 *
 * @param parent - The 5.1 parent
 *
 * @returns The transformed parent
 */
const transformParent = (
  parent: R51ReportItemParent
): CreateR51DocumentParent => ({
  Article_Version: parent.Article_Version,

  Authors: parent.Authors,

  Data_Type: 'Data_Type' in parent ? parent.Data_Type : undefined,

  Item_ID: parent.Item_ID && formatItemID(parent.Item_ID),

  Item_Name: parent.Title,

  Publication_Date:
    'Publication_Date' in parent ? parent.Publication_Date : undefined,
});

/**
 * Transform COUNTER 5.1 item from report into a COUNTER Document item
 *
 * @param item - The 5.1 item
 *
 * @returns The transformed item
 */
const transformItem = (item: R51ReportItem): CreateR51DocumentItem => ({
  Article_Version: 'Article_Version' in item ? item.Article_Version : undefined,

  Authors: 'Authors' in item ? item.Authors : undefined,

  Database: 'Database' in item ? item.Database : undefined,

  Item: 'Item' in item ? item.Item : undefined,

  Item_ID:
    'Item_ID' in item && item.Item_ID ? formatItemID(item.Item_ID) : undefined,

  Platform: item.Platform,

  Publication_Date:
    'Publication_Date' in item ? item.Publication_Date : undefined,

  Publisher: 'Publisher' in item ? item.Publisher : undefined,

  Publisher_ID: 'Publisher_ID' in item ? item.Publisher_ID : undefined,

  Title: 'Title' in item ? item.Title : undefined,
});

/**
 * Transform COUNTER 5.1 attribute from report into a COUNTER Document attribute
 *
 * @param attr - The 5.1 attribute
 *
 * @returns The transformed attribute
 */
const transformAttribute = (
  attr: R51ReportItem['Attribute_Performance'][number]
): CreateR51DocumentAttribute => ({
  Access_Method: 'Access_Method' in attr ? attr.Access_Method : undefined,

  Access_Type: 'Access_Type' in attr ? attr.Access_Type : undefined,

  Data_Type: 'Data_Type' in attr ? attr.Data_Type : undefined,

  YOP: 'YOP' in attr ? attr.YOP : undefined,
});

export type R51ReportData = {
  harvestDate: string;
  header: R51ReportHeader;
  item: R51ReportItem;
  parent?: R51ReportItemParent;
};

/**
 * Transform COUNTER 5.1 data from report into a COUNTER Document
 *
 * @param data - The COUNTER data
 * @param options - The options to use when inserting the documents
 *
 * @yields The transformed documents with their id
 */
export function* transformR51ItemToDocuments(
  data: R51ReportData,
  options: HarvestInsertOptions
): Generator<CreateR51Document & { _id: string }> {
  const reportId = data.header.Report_ID.toLowerCase();

  const identifiers =
    'Item_ID' in data.item && data.item.Item_ID
      ? getIdentifiers(data.item.Item_ID)
      : [];

  const header = transformHeader(data.header);
  const item = transformItem(data.item);
  const parent = data.parent && transformParent(data.parent);

  for (const attr of data.item.Attribute_Performance) {
    const attribute = transformAttribute(attr);

    for (const [Metric_Type, perf] of Object.entries(attr.Performance)) {
      const metricType = Metric_Type.toLowerCase();

      for (const [instance, count] of Object.entries(perf)) {
        const date = format(new Date(instance), 'yyyy-MM');

        if (typeof count !== 'number') {
          throw new TypeError('Count is not a number', {
            cause: { Metric_Type, X_Date_Month: date, identifiers },
          });
        }

        yield {
          ...item,
          ...attribute,
          Count: count,
          Item_Parent: parent,
          Metric_Type: Metric_Type,
          Report_Header: header,
          X_Date_Month: date,
          X_Harvested_At: data.harvestDate,
          _id: generateId(
            [date, reportId, metricType, ...(options.additionalIdParts ?? [])],
            identifiers
          ),
        };
      }
    }
  }
}
