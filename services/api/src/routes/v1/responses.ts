import type { FastifyReply } from 'fastify';
import { type StatusCodes, getReasonPhrase } from 'http-status-codes';

import { z } from '@ezcounter/models/lib/zod';

/**
 * Validation for an empty response
 */
export const EmptyResponse = z.null().describe('Success response');

/**
 * Validation for a basic response from the API
 */
export const BaseResponse = z.object({
  apiVersion: z.int().min(1),

  status: z
    .object({ code: z.int(), message: z.string() })
    .describe('HTTP Status'),
});

/**
 * Type for a basic response from the API
 */
type baseResponse = z.infer<typeof BaseResponse>;

/**
 * Build a basic response from the API
 *
 * @param reply - The original reply
 *
 * @returns The response that will be sent to clients
 */
const buildBaseResponse = (reply: FastifyReply): baseResponse => ({
  apiVersion: 1,
  status: {
    code: reply.statusCode,
    message: getReasonPhrase(reply.statusCode),
  },
});

/**
 * Validation for an error response from the API
 */
export const ErrorResponse = z.object({
  ...BaseResponse.shape,
  error: z
    .object({
      message: z.string(),
      cause: z.any().optional(),
      stack: z.array(z.string()).optional(),
    })
    .describe('Error details'),
});

/**
 * Type for an error response from the API
 */
export type ErrorResponse = z.infer<typeof ErrorResponse>;

/**
 * Type for a successful response without metadata from the API
 */
type SuccessBaseResponse<Content> = baseResponse & {
  content: Content;
};

/**
 * Type for a successful response with metadata from the API
 */
type SuccessMetaResponse<Content, Meta> = SuccessBaseResponse<Content> & {
  meta: Meta;
};

/**
 * Type for a successful response from the API
 */
export type SuccessResponse<Content, Meta = undefined> = Meta extends undefined
  ? SuccessBaseResponse<Content>
  : SuccessMetaResponse<Content, Meta>;

/**
 * Build a successful response from with or without metadata the API
 *
 * @param reply - The original reply
 * @param content - The content of the response
 * @param meta - The metadata about the response
 *
 * @returns The response that will be sent to clients
 */
export function buildResponse<Content, Meta = undefined>(
  reply: FastifyReply,
  content: Content,
  meta?: Meta
): SuccessResponse<Content, Meta>;
/**
 * Build a response with an error from the API
 *
 * @param reply - The original reply
 * @param error - The error of the response
 *
 * @returns The response that will be sent to clients
 */
export function buildResponse(reply: FastifyReply, error: Error): ErrorResponse;
/**
 * Build a response from the API
 *
 * @param reply - The original reply
 * @param content - The content or the error of the response
 * @param meta - The metadata about the response
 *
 * @returns The response that will be sent to clients
 */
export function buildResponse<Content, Meta = undefined>(
  reply: FastifyReply,
  content: Content | Error,
  meta?: Meta
): SuccessResponse<Content, Meta> | ErrorResponse {
  if (content instanceof Error) {
    return {
      ...buildBaseResponse(reply),
      error: {
        message: content.message,
        cause: content.cause,
        stack: content.stack?.split('\n'),
      },
    };
  }
  return {
    ...buildBaseResponse(reply),
    content,
    meta,
  } as SuccessResponse<Content, Meta>;
}

/**
 * Build validation for a successful response with or without metadata from the API
 *
 * @param content - The validation for the content of the response
 *
 * @returns The validation
 */
export const describeSuccess = <Content, Meta = undefined>(
  content: z.ZodType<Content>,
  meta?: z.ZodType<Meta>
):
  | z.ZodType<SuccessResponse<Content>>
  | z.ZodType<SuccessResponse<Content, Meta>> =>
  z.object({ ...BaseResponse.shape, content, meta });

/**
 * Describe errors responses that the route can send
 *
 * @param errors - List of error codes that route can send
 *
 * @returns Validation
 */
export const describeErrors = (
  errors: StatusCodes[]
): Record<StatusCodes, typeof ErrorResponse> =>
  Object.fromEntries(
    errors.map((code) => [code, ErrorResponse.describe(getReasonPhrase(code))])
  ) as Record<StatusCodes, typeof ErrorResponse>;
