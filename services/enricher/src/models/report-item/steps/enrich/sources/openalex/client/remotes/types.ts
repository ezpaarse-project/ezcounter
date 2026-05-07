import type { OpenAlexWork } from '../../dto';

/**
 * Interface for implementing a remote for OpenAlex data
 */
export type IOpenAlexRemote = {
  fetchManyWorkByDOI(dois: string[]): Promise<OpenAlexWork[]>;
};
