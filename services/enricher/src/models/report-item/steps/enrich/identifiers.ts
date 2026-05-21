import type { R51ReportItem, R5ReportItem } from '@ezcounter/counter/dto';

/**
 * Get the DOI of a COUNTER report item
 *
 * @param item - The COUNTER report item
 * @param release - The COUNTER release
 *
 * @returns The DOI of the item if found
 */
export function getDOIOfItem(
  item: R5ReportItem | R51ReportItem,
  release: string
): string | undefined {
  if (!('Item_ID' in item)) {
    return undefined;
  }

  switch (release) {
    case '5':
      if (Array.isArray(item.Item_ID)) {
        return item.Item_ID?.find(({ Type }) => Type === 'DOI')?.Value;
      }
      return undefined;

    case '5.1':
      if (!Array.isArray(item.Item_ID)) {
        return item.Item_ID?.DOI;
      }
      return undefined;

    default:
      return undefined;
  }
}

/**
 * Get the Print ISSN of a COUNTER report item
 *
 * @param item - The COUNTER report item
 * @param release - The COUNTER release
 *
 * @returns The Print ISSN of the item if found
 */
export function getPrintISSNOfItem(
  item: R5ReportItem | R51ReportItem,
  release: string
): string | undefined {
  if (!('Item_ID' in item)) {
    return undefined;
  }

  switch (release) {
    case '5':
      if (Array.isArray(item.Item_ID)) {
        return item.Item_ID?.find(({ Type }) => Type === 'Print_ISSN')?.Value;
      }
      return undefined;

    case '5.1':
      if (!Array.isArray(item.Item_ID)) {
        return item.Item_ID?.Print_ISSN;
      }
      return undefined;

    default:
      return undefined;
  }
}

/**
 * Get the Online ISSN of a COUNTER report item
 *
 * @param item - The COUNTER report item
 * @param release - The COUNTER release
 *
 * @returns The Online ISSN of the item if found
 */
export function getOnlineISSNOfItem(
  item: R5ReportItem | R51ReportItem,
  release: string
): string | undefined {
  if (!('Item_ID' in item)) {
    return undefined;
  }

  switch (release) {
    case '5':
      if (Array.isArray(item.Item_ID)) {
        return item.Item_ID?.find(({ Type }) => Type === 'Online_ISSN')?.Value;
      }
      return undefined;

    case '5.1':
      if (!Array.isArray(item.Item_ID)) {
        return item.Item_ID?.Online_ISSN;
      }
      return undefined;

    default:
      return undefined;
  }
}
