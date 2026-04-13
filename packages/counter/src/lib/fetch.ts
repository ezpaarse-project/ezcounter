import { type $Fetch, ofetch } from 'ofetch';

/**
 * Transform query params into params supported by COUNTER API
 *
 * @param value - The value of the param
 * @param paramsSeparator - How to separate params
 *
 * @returns The value
 */
function transformCOUNTERQuery(
  value: unknown,
  paramsSeparator = '|'
): string | undefined {
  if (Array.isArray(value)) {
    return value.map((item) => `${item}`).join(paramsSeparator);
  }

  switch (typeof value) {
    case 'boolean':
      return value ? 'True' : 'False';

    case 'function':
    case 'object':
    case 'symbol':
    case 'undefined':
      return undefined;

    default:
      return `${value}`;
  }
}

/**
 * Type for options needed to setup fetch
 */
export type CreateDataHostFetchOptions = {
  /** Base URL to request API */
  baseUrl: string;
  /** User Agent to use when requesting API */
  userAgent: string;
  /** Params to add to every request */
  params?: Record<string, string | boolean | string[]>;
  /** How to split multi-valuated params */
  paramsSeparator?: string;
  /** How to auth requests to API  */
  auth: {
    customer_id?: string;
    requestor_id?: string;
    api_key?: string;
  };
  /** Signal to abort request */
  signal?: AbortSignal;
};

/**
 * Create a fetch function to make requests to a COUNTER API
 *
 * @param opts - The options needed to setup fetch
 *
 * @returns The fetch function
 */
export const createDataHostFetch = (opts: CreateDataHostFetchOptions): $Fetch =>
  ofetch.create({
    baseURL: opts.baseUrl,
    headers: {
      Accept: 'application/json',
      'User-Agent': opts.userAgent,
    },
    onRequest: [
      // Parse query parameters
      ({ options }): void => {
        options.query = Object.fromEntries(
          Object.entries(options.query ?? {}).map(([key, value]) => [
            key,
            transformCOUNTERQuery(value, opts.paramsSeparator),
          ])
        );
      },
    ],
    query: {
      ...opts.params,
      api_key: opts.auth.api_key,
      customer_id: opts.auth.customer_id,
      requestor_id: opts.auth.requestor_id,
    },
    signal: opts.signal,
  });
