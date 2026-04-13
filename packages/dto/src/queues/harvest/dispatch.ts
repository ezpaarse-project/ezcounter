import { z } from '../..';

/**
 * Validation for the data used to dispatch harvest jobs
 */
export const HarvestDispatchData = z.object({
  queueName: z.string().describe('Queue to find harvest jobs'),
});

/**
 * Type for the data used to dispatch harvest jobs
 */
export type HarvestDispatchData = z.infer<typeof HarvestDispatchData>;
