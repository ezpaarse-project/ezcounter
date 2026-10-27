import { z } from '@ezcounter/dto';
import {
  HarvestAdditionalParams,
  HarvestCatchAllParams,
} from '@ezcounter/dto/harvest';

import { prepareDiffFor } from '~/models/diff/dto';

const diff = prepareDiffFor<DataHost>();

/**
 * Validation for a Data Host from source
 */
export const DataHost = z.object({
  _appliedChanges: z
    .array(z.string())
    .describe('IDs of changes applied when serving object'),

  createdAt: z.coerce.date().describe('Creation date'),

  id: z.string().describe('ID of the host'),

  local: z.boolean().describe('Is the host local to this registry'),

  name: z.string().describe('Name of the host'),

  params: HarvestAdditionalParams.describe(
    'Additional params to use when requesting host'
  ),

  updatedAt: z.coerce.date().nullable().describe('Last update date'),
});

/**
 * Type for a registered Data Host
 */
export type DataHost = z.infer<typeof DataHost>;

/**
 * Validation for a modification part of a Data Host
 */
export const DataHostDiffEntry = z.union([
  z.discriminatedUnion('key', [diff.describe('name', DataHost.shape['name'])]),
  diff.describeNested('params', HarvestCatchAllParams),
]);

/**
 * Type for a modification part of a Data Host
 */
export type DataHostDiffEntry = z.infer<typeof DataHostChange>;

/**
 * Validation for a change on a Data Host
 */
export const DataHostChange = z.object({
  createdAt: z.coerce.date().describe('Creation date'),

  dataHostId: DataHost.shape.id,

  diff: z
    .array(DataHostDiffEntry)
    .min(1)
    .describe('Modifications to apply to host'),

  id: z.string().describe('ID of the change'),
});

/**
 * Type for a change on a Data Host
 */
export type DataHostChange = z.infer<typeof DataHostChange>;
