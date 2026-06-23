import { describe, expect, it, vi } from 'vitest';

import type { ReportValidationResult } from '@ezcounter/dto/report';

import type { ErrorResponse, SuccessResponse } from '~/routes/v1/responses';
import { createTestServer } from '~/../__tests__/fastify/v1';
import { validateCOUNTERReport } from '~/rpc/report/validate';

import router from '.';

vi.mock(import('~/rpc/report/validate'));

const server = await createTestServer(async (fastify) => {
  fastify.register(router, {
    prefix: '/reports',
  });
});

describe('post /reports/_validate', () => {
  describe('application/json', () => {
    it('should return validation result', async () => {
      expect.hasAssertions();
      vi.mocked(validateCOUNTERReport).mockResolvedValue({
        header: { errors: [], valid: true },
        items: { errors: [], valid: true },
      });

      const response = await server.inject({
        body: { release: '5.1', report: { Report_ID: 'IR' }, reportId: 'ir' },
        method: 'POST',
        url: '/reports/_validate',
      });

      const { content } =
        response.json<SuccessResponse<ReportValidationResult>>();

      expect(response).toHaveProperty('statusCode', 200);
      expect(content).toMatchObject({
        header: { errors: [], valid: true },
        items: { errors: [], valid: true },
      });
    });

    it('should return BAD_REQUEST if body is invalid', async () => {
      expect.hasAssertions();
      const response = await server.inject({
        body: { release: '5', reportId: 'pr' },
        method: 'POST',
        url: '/reports/_validate',
      });

      const { error } = response.json<ErrorResponse>();

      expect(response).toHaveProperty('statusCode', 400);
      expect(error).toHaveProperty(
        'message',
        "Request doesn't match the schema"
      );
      expect(error).toHaveProperty('cause.issues.0.message', 'Invalid input');
    });
  });

  describe('multipart/form-data', () => {
    it('should return validation result', async () => {
      expect.hasAssertions();
      const data = new FormData();
      data.set('release', '5.1');
      data.set('report', new Blob(["{ Report_ID: 'IR' }"]));
      data.set('reportId', 'ir');

      vi.mocked(validateCOUNTERReport).mockResolvedValue({
        header: { errors: [], valid: true },
        items: { errors: [], valid: true },
      });

      const response = await server.inject({
        body: data,
        method: 'POST',
        url: '/reports/_validate',
      });

      const { content } =
        response.json<SuccessResponse<ReportValidationResult>>();

      expect(response).toHaveProperty('statusCode', 200);
      expect(content).toMatchObject({
        header: { errors: [], valid: true },
        items: { errors: [], valid: true },
      });
    });

    it('should return BAD_REQUEST if body is invalid', async () => {
      expect.hasAssertions();
      const data = new FormData();
      data.set('release', '5');
      data.set('reportId', 'pr');

      const response = await server.inject({
        body: data,
        method: 'POST',
        url: '/reports/_validate',
      });

      const { error } = response.json<ErrorResponse>();

      expect(response).toHaveProperty('statusCode', 400);
      expect(error).toHaveProperty(
        'message',
        "Request doesn't match the schema"
      );
      expect(error).toHaveProperty('cause.issues.0.message', 'Invalid input');
    });
  });
});
