import type { StatusCodes } from 'http-status-codes';

export class HTTPError extends Error {
  /**
   * Wrapper around a classic Error to add StatusCode
   *
   * @param statusCode - The StatusCode of the error
   * @param message - The message of the error
   * @param options - The options of the error
   */
  constructor(
    public statusCode: StatusCodes,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}
