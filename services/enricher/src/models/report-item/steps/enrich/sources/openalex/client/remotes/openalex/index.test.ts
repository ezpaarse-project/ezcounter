import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { OpenAlexRemote } from '.';

describe('openAlex remote', () => {
  describe('fetch documents by DOI', () => {
    const server = setupServer(
      // oxlint-disable-next-line typescript/no-explicit-any
      http.post<Record<string, string>, Record<string, any>>(
        'https://mocked-openalex.localhost',
        async ({ request }) => {
          const url = new URL(request.url);

          if (url.searchParams.get('api_key') === null) {
            return HttpResponse.json(
              { message: 'API key not found' },
              { status: 401 }
            );
          }

          const { oqo } = await request.clone().json();
          const query = oqo.filter_rows[0].filters;
          // oxlint-disable-next-line typescript/no-explicit-any
          const dois = query.map((item: any) => item.value);

          return HttpResponse.json({
            meta: {
              next_cursor: null,
            },
            results: dois.map((doi: string) => ({
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
      // oxlint-disable-next-line typescript/no-explicit-any
      http.post<Record<string, string>, Record<string, any>>(
        'https://invalid-openalex.localhost',
        async ({ request }) => {
          const { oqo } = await request.clone().json();
          const query = oqo.filter_rows[0].filters;
          // oxlint-disable-next-line typescript/no-explicit-any
          const dois = query.map((item: any) => item.value);

          return HttpResponse.json({
            data: dois.map((doi: string) => ({ foobar: doi })),
          });
        }
      ),
      http.post('https://error-openalex.localhost', () =>
        HttpResponse.json({ message: 'Something went wrong' }, { status: 500 })
      ),
      http.post('https://network-openalex.localhost', () =>
        HttpResponse.error()
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

    it('should dedupe DOIs', async () => {
      expect.hasAssertions();
      const remote = new OpenAlexRemote({
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

    it('should remote URLs from IDs', async () => {
      expect.hasAssertions();
      const remote = new OpenAlexRemote({
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

    it('should skip invalid responses', async () => {
      expect.hasAssertions();
      const remote = new OpenAlexRemote({
        apiKey: '',
        baseUrl: 'https://invalid-openalex.localhost/',
        retry: 0,
        retryDelay: 0,
        timeout: 0,
      });

      const results = await remote.fetchManyWorkByDOI(['10.9999/xxxxxx1']);

      expect(results).toHaveLength(0);
    });

    it('should skip errors from remote', async () => {
      expect.hasAssertions();
      const remote = new OpenAlexRemote({
        apiKey: '',
        baseUrl: 'https://error-openalex.localhost/',
        retry: 0,
        retryDelay: 0,
        timeout: 0,
      });

      const results = await remote.fetchManyWorkByDOI(['10.9999/xxxxxx1']);

      expect(results).toHaveLength(0);
    });

    it('should skip errors from client', async () => {
      expect.hasAssertions();
      const remote = new OpenAlexRemote({
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
