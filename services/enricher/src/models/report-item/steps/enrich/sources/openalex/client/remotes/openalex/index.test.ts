import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { OpenAlexRemote } from '.';

describe('openAlex remote', () => {
  describe('fetch documents by DOI', () => {
    const server = setupServer(
      http.get('https://mocked-openalex.localhost/works', ({ request }) => {
        const url = new URL(request.url);
        const dois =
          url.searchParams.get('filter')?.replace('doi:', '').split('|') ?? [];

        if (url.searchParams.get('api_key') === null) {
          return HttpResponse.json(
            { message: 'API key not found' },
            { status: 401 }
          );
        }

        return HttpResponse.json({
          meta: {
            next_cursor: null,
          },
          results: dois.map((doi) => ({
            authorships: [],
            ids: {
              doi: `https://doi.org/${doi}`,
              openalex: 'https://openalex.org/XXXXXXXXXXX',
            },
            open_access: { is_oa: false, oa_status: 'closed' },
          })),
        });
      }),
      http.get('https://invalid-openalex.localhost/works', ({ request }) => {
        const url = new URL(request.url);
        const dois =
          url.searchParams.get('filter')?.replace('doi:', '').split('|') ?? [];

        return HttpResponse.json({
          data: dois.map((doi) => ({ foobar: doi })),
        });
      }),
      http.get('https://error-openalex.localhost/works', () =>
        HttpResponse.json({ message: 'Something went wrong' }, { status: 500 })
      ),
      http.get('https://network-openalex.localhost/works', () =>
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
