import type { EzUnpaywallDocument } from '../../dto';

/**
 * Interface for implementing a remote for ezUnpaywall data
 */
export type IEzUnpaywallRemote = {
  fetchManyDocumentByDOI(dois: string[]): Promise<EzUnpaywallDocument[]>;
};
