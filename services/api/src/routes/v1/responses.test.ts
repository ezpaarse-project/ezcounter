import { describe, expect, test } from 'vitest';

import { z } from '@ezcounter/models/lib/zod';

import {
  type ErrorResponse,
  type SuccessResponse,
  describeSuccess,
  describeErrors,
  buildResponse,
} from './responses';

describe('Success responses', () => {
  describe('Validation (describeSuccess)', () => {
    const content = z.array(
      z.object({
        foo: z.string(),
      })
    );
    type Content = z.infer<typeof content>;

    const meta = z.object({
      size: z.int(),
    });
    type Meta = z.infer<typeof meta>;

    test('should describe a response with content', () => {
      const response: SuccessResponse<Content> = {
        apiVersion: 1,
        status: {
          code: 200,
          message: 'OK',
        },
        content: [
          {
            foo: 'bar',
          },
        ],
      };

      const result = describeSuccess(content).safeParse(response);

      expect(result.success).toBe(true);
    });

    test('should throw if no content content', () => {
      const response: SuccessResponse<null> = {
        apiVersion: 1,
        status: {
          code: 200,
          message: 'OK',
        },
        content: null,
      };

      const result = describeSuccess(content).safeParse(response);

      expect(result.success).toBe(false);
    });

    test('should throw if status is invalid', () => {
      const response = {
        apiVersion: 1,
        status: {
          code: 999,
          message: 'UNKNOWN STATUS',
        },
        content: null,
      };

      const result = describeSuccess(content).safeParse(response);

      expect(result.success).toBe(false);
    });

    test('should describe a response with meta', () => {
      const response: SuccessResponse<Content, Meta> = {
        apiVersion: 1,
        status: {
          code: 200,
          message: 'OK',
        },
        content: [
          {
            foo: 'bar',
          },
        ],
        meta: {
          size: 1,
        },
      };

      const result = describeSuccess(content, meta).safeParse(response);

      expect(result.success).toBe(true);
    });

    test('should throw if no meta', () => {
      const response: SuccessResponse<z.infer<typeof content>, null> = {
        apiVersion: 1,
        status: {
          code: 200,
          message: 'OK',
        },
        content: [
          {
            foo: 'bar',
          },
        ],
        meta: null,
      };

      const result = describeSuccess(content, meta).safeParse(response);

      expect(result.success).toBe(false);
    });
  });

  describe('Response (buildResponse)', () => {
    const expectedResponse = z.object({
      apiVersion: z.int().min(1),

      status: z.object({ code: z.int(), message: z.string() }),
      content: z.array(
        z.object({
          foo: z.string(),
        })
      ),
    });

    const expectedMeta = z.object({
      apiVersion: z.int().min(1),

      status: z.object({ code: z.int(), message: z.string() }),
      content: z.array(
        z.object({
          foo: z.string(),
        })
      ),

      meta: z.object({
        size: z.int(),
      }),
    });

    test('should build valid response', () => {
      const response = buildResponse({ statusCode: 200 }, [{ foo: 'bar' }]);

      const result = expectedResponse.safeParse(response);

      expect(result.success).toBe(true);
    });

    test('should build valid response with meta', () => {
      const response = buildResponse({ statusCode: 200 }, [{ foo: 'bar' }], {
        size: 1,
      });

      const result = expectedMeta.safeParse(response);

      expect(result.success).toBe(true);
    });
  });
});

describe('Error responses', () => {
  describe('Validation (describeErrors)', () => {
    test('should allow to describe one error', () => {
      const errors = describeErrors([500]);

      expect(errors).toHaveProperty('500');
    });

    test('should allow to describe multiple errors', () => {
      const errors = describeErrors([400, 406]);

      expect(errors).toHaveProperty('400');
      expect(errors).toHaveProperty('406');
    });

    test('should describe a response with error', () => {
      const response: ErrorResponse = {
        apiVersion: 1,
        status: {
          code: 400,
          message: 'Bad Request',
        },
        error: {
          message: 'Example error',
        },
      };

      const errorSchema = describeErrors([400])[400];
      const result = errorSchema.safeParse(response);

      expect(result.success).toBe(true);
    });

    test('should throw if no error', () => {
      const response = {
        apiVersion: 1,
        status: {
          code: 400,
          message: 'Bad Request',
        },
        error: null,
      };

      const errorSchema = describeErrors([400])[400];
      const result = errorSchema.safeParse(response);

      expect(result.success).toBe(false);
    });

    test('should throw if status is invalid', () => {
      const response = {
        apiVersion: 1,
        status: {
          code: 999,
          message: 'UNKNOWN STATUS',
        },
        error: {
          message: 'Invalid error',
        },
      };

      const errorSchema = describeErrors([400])[400];
      const result = errorSchema.safeParse(response);

      expect(result.success).toBe(false);
    });

    describe('Response (buildResponse)', () => {
      const expectedResponse = z.object({
        apiVersion: z.int().min(1),

        status: z.object({ code: z.int(), message: z.string() }),

        error: z.object({
          message: z.string(),
        }),
      });

      test('should build valid response', () => {
        const response = buildResponse(
          { statusCode: 500 },
          new Error('Sample error')
        );

        const result = expectedResponse.safeParse(response);

        expect(result.success).toBe(true);
      });
    });
  });
});
