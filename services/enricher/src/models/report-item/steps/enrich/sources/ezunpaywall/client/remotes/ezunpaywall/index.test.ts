import { HttpResponse, graphql } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';

import { EzUnpaywallRemote } from '.';

describe('ezUnpaywall remote (EzUnpaywallRemote)', () => {
  describe('Fetch documents by DOI (fetchManyDocumentByDOI)', () => {
    const server = setupServer(
      graphql
        .link('https://mocked-ezunpaywall.localhost/graphql')
        .query<Record<string, unknown>, { dois: string[] }>(
          'GetByDOI',
          ({ variables: { dois }, request }) => {
            if (request.headers.get('x-api-key') === null) {
              return HttpResponse.json({
                data: { unpaywall: [] },
                errors: [{ message: 'No API key provided' }],
              });
            }

            return HttpResponse.json({
              data: { unpaywall: dois.map((doi) => ({ doi })) },
            });
          }
        ),
      graphql
        .link('https://invalid-ezunpaywall.localhost/graphql')
        .query<Record<string, unknown>, { dois: string[] }>(
          'GetByDOI',
          ({ variables: { dois } }) =>
            HttpResponse.json({
              data: { unpaywall: dois.map((doi) => ({ foobar: doi })) },
            })
        ),
      graphql
        .link('https://error-ezunpaywall.localhost/graphql')
        .query('GetByDOI', () =>
          HttpResponse.json({
            data: { unpaywall: [] },
            errors: [{ message: '' }],
          })
        ),
      graphql
        .link('https://network-ezunpaywall.localhost/graphql')
        .query('GetByDOI', () => HttpResponse.error())
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
      const remote = new EzUnpaywallRemote({
        apiKey: '',
        baseUrl: 'https://mocked-ezunpaywall.localhost/graphql',
        retry: 0,
        retryDelay: 0,
        timeout: 0,
      });

      const results = await remote.fetchManyDocumentByDOI([
        '10.9999/xxxxxx1',
        '10.9999/xxxxxx1',
        '10.9999/xxxxxx1',
      ]);

      expect(results).toHaveLength(1);
    });

    test('should skip invalid responses', async () => {
      const remote = new EzUnpaywallRemote({
        apiKey: '',
        baseUrl: 'https://invalid-ezunpaywall.localhost/graphql',
        retry: 0,
        retryDelay: 0,
        timeout: 0,
      });

      const results = await remote.fetchManyDocumentByDOI(['10.9999/xxxxxx1']);

      expect(results).toHaveLength(0);
    });

    test('should skip errors from remote', async () => {
      const remote = new EzUnpaywallRemote({
        apiKey: '',
        baseUrl: 'https://error-ezunpaywall.localhost/graphql',
        retry: 0,
        retryDelay: 0,
        timeout: 0,
      });

      const results = await remote.fetchManyDocumentByDOI(['10.9999/xxxxxx1']);

      expect(results).toHaveLength(0);
    });

    test('should skip errors from client', async () => {
      const remote = new EzUnpaywallRemote({
        apiKey: '',
        baseUrl: 'https://network-ezunpaywall.localhost/graphql',
        retry: 0,
        retryDelay: 0,
        timeout: 0,
      });

      const results = await remote.fetchManyDocumentByDOI(['10.9999/xxxxxx1']);

      expect(results).toHaveLength(0);
    });
  });
});
