import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

import { CNRSGatewayRemote } from '.';

describe('CNRS OpenAlex remote (CNRSGatewayRemote)', () => {
  describe('Fetch documents by DOI (fetchManyWorkByDOI)', () => {
    const server = setupServer(
      http.post<Record<string, string>, string[]>(
        'https://mocked-openalex.localhost/openalex/works',
        async ({ request }) => {
          if (request.headers.get('x-api-key') === null) {
            return HttpResponse.json(
              { message: 'No API key provided' },
              { status: 401 }
            );
          }

          const dois = await request.clone().json();

          return HttpResponse.json({
            data: dois.map((doi) => ({
              authorships: [],
              ids: {
                doi: `https://doi.org/${doi}`,
                openalex: 'https://openalex.org/XXXXXXXXXXX',
              },
              open_access: { is_oa: false, oa_status: 'closed' },
            })),
          });
        }
      ),
      http.post<Record<string, string>, string[]>(
        'https://invalid-openalex.localhost/openalex/works',
        async ({ request }) => {
          const dois = await request.clone().json();

          return HttpResponse.json({
            data: dois.map((doi) => ({ foobar: doi })),
          });
        }
      ),
      http.post<Record<string, string>, string[]>(
        'https://error-openalex.localhost/openalex/works',
        () =>
          HttpResponse.json(
            { message: 'Something went wrong' },
            { status: 500 }
          )
      ),
      http.post<Record<string, string>, string[]>(
        'https://network-openalex.localhost/openalex/works',
        () => HttpResponse.error()
      )
    );

    // Start server before all tests
    beforeAll(() => {
      server.listen({ onUnhandledRequest: 'error' });
    });
    // Reset handlers after each test for test isolation
    afterEach(() => {
      server.resetHandlers();
    });
    // Close server after all tests
    afterAll(() => {
      server.close();
    });

    test('should dedupe DOIs', async () => {
      const remote = new CNRSGatewayRemote({
        apiKey: '',
        baseUrl: 'https://mocked-openalex.localhost/',
        retry: 0,
        retryDelay: 0,
        timeout: 0,
      });

      const results = await remote.fetchManyWorkByDOI([
        '10.9999/xxxxxx1',
        '10.9999/xxxxxx1',
        '10.9999/xxxxxx1',
      ]);

      expect(results).toHaveLength(1);
    });

    test('should remote URLs from IDs', async () => {
      const remote = new CNRSGatewayRemote({
        apiKey: '',
        baseUrl: 'https://mocked-openalex.localhost/',
        retry: 0,
        retryDelay: 0,
        timeout: 0,
      });

      const results = await remote.fetchManyWorkByDOI(['10.9999/xxxxxx1']);

      expect(results).toHaveProperty('0.ids.doi', '10.9999/xxxxxx1');
      expect(results).toHaveProperty('0.ids.openalex', 'XXXXXXXXXXX');
    });

    test('should skip invalid responses', async () => {
      const remote = new CNRSGatewayRemote({
        apiKey: '',
        baseUrl: 'https://invalid-openalex.localhost/',
        retry: 0,
        retryDelay: 0,
        timeout: 0,
      });

      const results = await remote.fetchManyWorkByDOI(['10.9999/xxxxxx1']);

      expect(results).toHaveLength(0);
    });

    test('should skip errors from remote', async () => {
      const remote = new CNRSGatewayRemote({
        apiKey: '',
        baseUrl: 'https://error-openalex.localhost/',
        retry: 0,
        retryDelay: 0,
        timeout: 0,
      });

      const results = await remote.fetchManyWorkByDOI(['10.9999/xxxxxx1']);

      expect(results).toHaveLength(0);
    });

    test('should skip errors from client', async () => {
      const remote = new CNRSGatewayRemote({
        apiKey: '',
        baseUrl: 'https://network-openalex.localhost/',
        retry: 0,
        retryDelay: 0,
        timeout: 0,
      });

      const results = await remote.fetchManyWorkByDOI(['10.9999/xxxxxx1']);

      expect(results).toHaveLength(0);
    });
  });
});
