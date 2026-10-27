import { z } from '@ezcounter/dto';
import {
  HarvestAdditionalParams,
  HarvestCatchAllParams,
  HarvestDataHostOptions,
  HarvestDownloadOptions,
  HarvestReportPeriodDate,
} from '@ezcounter/dto/harvest';

import { prepareDiffFor } from '~/models/diff/dto';

const diff = prepareDiffFor<DataHostRelease>();

/**
 * Validation for a release supported by Data Host
 */
export const DataHostRelease = z.object({
  _appliedChanges: z
    .array(z.string())
    .describe('IDs of changes applied when serving object'),

  availableSince: HarvestReportPeriodDate.nullable().describe(
    'Minimum period where this release can be used'
  ),

  baseURL: HarvestDataHostOptions.shape.baseURL,

  compliant: z
    .boolean()
    .describe('Whether the release is actually fully COUNTER compliant'),

  createdAt: z.coerce.date().describe('Creation date'),

  dataHostId: z.string().describe('ID of the Data Host'),

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting data host using release'
  ),

  paramsSeparator: HarvestDataHostOptions.shape.paramsSeparator.unwrap(),

  periodFormat: HarvestDataHostOptions.shape.periodFormat.unwrap(),

  release: HarvestDownloadOptions.shape.release,

  requiredAuth: z
    .object({
      api_key: z.boolean().optional(),
      customer_id: z.boolean().optional(),
      requestor_id: z.boolean().optional(),
    })
    .describe('Auth parameters required to harvest properly'),

  supported: z.boolean().describe('Is the release supported'),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a release supported by Data Host
 */
export type DataHostRelease = z.infer<typeof DataHostRelease>;

/**
 * Validation for a modification part of a Data Host
 */
export const DataHostReleaseDiffEntry = z.union([
  z.discriminatedUnion('key', [
    diff.describe('availableSince', DataHostRelease.shape['availableSince']),
    diff.describe('baseURL', DataHostRelease.shape['baseURL']),
    diff.describe('compliant', DataHostRelease.shape['compliant']),
    diff.describe('paramsSeparator', DataHostRelease.shape['paramsSeparator']),
    diff.describe('periodFormat', DataHostRelease.shape['periodFormat']),
    diff.describe('supported', DataHostRelease.shape['supported']),
    diff.describe(
      'requiredAuth.api_key',
      DataHostRelease.shape['requiredAuth'].shape['api_key']
    ),
    diff.describe(
      'requiredAuth.customer_id',
      DataHostRelease.shape['requiredAuth'].shape['customer_id']
    ),
    diff.describe(
      'requiredAuth.requestor_id',
      DataHostRelease.shape['requiredAuth'].shape['requestor_id']
    ),
  ]),
  diff.describeNested('params', HarvestCatchAllParams),
]);

/**
 * Type for a modification part of a Data Host
 */
export type DataHostReleaseDiffEntry = z.infer<typeof DataHostReleaseDiffEntry>;

/**
 * Validation for a change on a release
 */
export const DataHostReleaseChange = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  dataHostId: DataHostRelease.shape.dataHostId,

  diff: z
    .array(DataHostReleaseDiffEntry)
    .min(1)
    .describe('Modifications to apply to release'),

  id: z.string().describe('ID of the change'),

  release: DataHostRelease.shape.release,
});

/**
 * Type for a change on a release
 */
export type DataHostReleaseChange = z.infer<typeof DataHostReleaseChange>;
