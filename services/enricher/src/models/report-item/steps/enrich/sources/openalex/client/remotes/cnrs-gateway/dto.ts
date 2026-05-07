import { z } from '@ezcounter/dto';

import { OpenAlexWork } from '../../../dto';

/**
 * Validation for the response from CNRS's gateway of OpenAlex
 */
export const CNRSGatewayResponse = z.looseObject({
  data: z.array(OpenAlexWork),
});

/**
 * Type for the response from CNRS's gateway of OpenAlex
 */
export type CNRSGatewayResponse = z.infer<typeof CNRSGatewayResponse>;
