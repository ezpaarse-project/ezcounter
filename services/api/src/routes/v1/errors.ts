import type { StatusCodes } from 'http-status-codes';

export class HTTPError extends Error {
  constructor(
    public statusCode: StatusCodes,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}
