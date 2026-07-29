import { z } from '@ezcounter/dto';

import { EzUnpaywallDocument } from '../../../dto';

const EzUnpaywallError = z.looseObject({ message: z.string() });

/**
 * Validation for the response from ezUnpaywall
 */
export const EzUnpaywallResponse = z.looseObject({
  data: z.looseObject({
    unpaywall: z.array(EzUnpaywallDocument).nullable(),
  }),
  errors: z.array(EzUnpaywallError).nullish(),
});

/**
 * Type for the response from ezUnpaywall
 */
export type EzUnpaywallResponse = z.infer<typeof EzUnpaywallResponse>;
