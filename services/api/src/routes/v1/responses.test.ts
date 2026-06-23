import { describe, expect, it } from 'vitest';

import { z } from '@ezcounter/dto';

import {
  type ErrorResponse,
  type SuccessResponse,
  buildResponse,
  describeErrors,
  describeSuccess,
} from './responses';

describe('success responses', () => {
  describe('validation (describeSuccess)', () => {
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

    it('should describe a response with content', () => {
      expect.hasAssertions();
      const response: SuccessResponse<Content> = {
        apiVersion: 1,
        content: [
          {
            foo: 'bar',
          },
        ],
        status: {
          code: 200,
          message: 'OK',
        },
      };

      const result = describeSuccess(content).safeParse(response);

      expect(result.success).toBe(true);
    });

    it('should throw if no content content', () => {
      expect.hasAssertions();
      const response: SuccessResponse<null> = {
        apiVersion: 1,
        content: null,
        status: {
          code: 200,
          message: 'OK',
        },
      };

      const result = describeSuccess(content).safeParse(response);

      expect(result.success).toBe(false);
    });

    it('should throw if status is invalid', () => {
      expect.hasAssertions();
      const response = {
        apiVersion: 1,
        content: null,
        status: {
          code: 999,
          message: 'UNKNOWN STATUS',
        },
      };

      const result = describeSuccess(content).safeParse(response);

      expect(result.success).toBe(false);
    });

    it('should describe a response with meta', () => {
      expect.hasAssertions();
      const response: SuccessResponse<Content, Meta> = {
        apiVersion: 1,
        content: [
          {
            foo: 'bar',
          },
        ],
        meta: {
          size: 1,
        },
        status: {
          code: 200,
          message: 'OK',
        },
      };

      const result = describeSuccess(content, meta).safeParse(response);

      expect(result.success).toBe(true);
    });

    it('should throw if no meta', () => {
      expect.hasAssertions();
      const response: SuccessResponse<z.infer<typeof content>, null> = {
        apiVersion: 1,
        content: [
          {
            foo: 'bar',
          },
        ],
        meta: null,
        status: {
          code: 200,
          message: 'OK',
        },
      };

      const result = describeSuccess(content, meta).safeParse(response);

      expect(result.success).toBe(false);
    });
  });

  describe('response (buildResponse)', () => {
    const expectedResponse = z.object({
      apiVersion: z.int().min(1),

      content: z.array(
        z.object({
          foo: z.string(),
        })
      ),
      status: z.object({ code: z.int(), message: z.string() }),
    });

    const expectedMeta = z.object({
      apiVersion: z.int().min(1),

      content: z.array(
        z.object({
          foo: z.string(),
        })
      ),
      meta: z.object({
        size: z.int(),
      }),

      status: z.object({ code: z.int(), message: z.string() }),
    });

    it('should build valid response', () => {
      expect.hasAssertions();
      const response = buildResponse({ statusCode: 200 }, [{ foo: 'bar' }]);

      const result = expectedResponse.safeParse(response);

      expect(result.success).toBe(true);
    });

    it('should build valid response with meta', () => {
      expect.hasAssertions();
      const response = buildResponse({ statusCode: 200 }, [{ foo: 'bar' }], {
        size: 1,
      });

      const result = expectedMeta.safeParse(response);

      expect(result.success).toBe(true);
    });
  });
});

describe('error responses', () => {
  describe('validation (describeErrors)', () => {
    it('should allow to describe one error', () => {
      expect.hasAssertions();
      const errors = describeErrors([500]);

      expect(errors).toHaveProperty('500');
    });

    it('should allow to describe multiple errors', () => {
      expect.hasAssertions();
      const errors = describeErrors([400, 406]);

      expect(errors).toHaveProperty('400');
      expect(errors).toHaveProperty('406');
    });

    it('should describe a response with error', () => {
      expect.hasAssertions();
      const response: ErrorResponse = {
        apiVersion: 1,
        error: {
          message: 'Example error',
        },
        status: {
          code: 400,
          message: 'Bad Request',
        },
      };

      const { 400: errorSchema } = describeErrors([400]);
      const result = errorSchema.safeParse(response);

      expect(result.success).toBe(true);
    });

    it('should throw if no error', () => {
      expect.hasAssertions();
      const response = {
        apiVersion: 1,
        error: null,
        status: {
          code: 400,
          message: 'Bad Request',
        },
      };

      const { 400: errorSchema } = describeErrors([400]);
      const result = errorSchema.safeParse(response);

      expect(result.success).toBe(false);
    });

    it('should throw if status is invalid', () => {
      expect.hasAssertions();
      const response = {
        apiVersion: 1,
        error: {
          message: 'Invalid error',
        },
        status: {
          code: 999,
          message: 'UNKNOWN STATUS',
        },
      };

      const { 400: errorSchema } = describeErrors([400]);
      const result = errorSchema.safeParse(response);

      expect(result.success).toBe(false);
    });

    describe('response (buildResponse)', () => {
      const expectedResponse = z.object({
        apiVersion: z.int().min(1),

        error: z.object({
          message: z.string(),
        }),

        status: z.object({ code: z.int(), message: z.string() }),
      });

      it('should build valid response', () => {
        expect.hasAssertions();
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
