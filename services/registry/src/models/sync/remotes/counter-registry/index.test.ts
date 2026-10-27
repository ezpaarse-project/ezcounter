import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { CounterRegistryRemote } from '.';

describe('fetch data hosts', () => {
  const server = setupServer(
    // oxlint-disable-next-line typescript/no-explicit-any
    http.get('https://mocked-registry.localhost/v1/platform', () =>
      HttpResponse.json([
        // Valid host
        {
          abbrev: 'AOM',
          id: 'bf9a2458-2386-48c5-a810-4a33c2dacf80',
          name: 'Academy of Management',
          reports: [
            {
              counter_release: '5',
              report_id: 'DR',
            },
            {
              counter_release: '5',
              report_id: 'TR',
            },
            {
              counter_release: '5.1',
              report_id: 'PR',
            },
            {
              counter_release: '5.1',
              report_id: 'IR',
            },
          ],
          sushi_services: [
            {
              counter_release: '5.1',
              url: 'https://mocked-registry.localhost/v1/sushi-service/38641ece-a528-4296-b18f-64762e7adfe6/?format=json',
            },
            {
              counter_release: '5',
              url: 'https://mocked-registry.localhost/v1/sushi-service/21f2d1ed-76fe-4ecc-b939-83209f3de125/?format=json',
            },
          ],
        },
        // Invalid host (report should be report_id)
        {
          abbrev: '',
          id: '6e0a9356-e294-4617-880c-9cdcbbc4487b',
          name: 'Access Engineering & Access Science',
          reports: [
            {
              counter_release: '5',
              report: 'DR',
            },
            {
              counter_release: '5',
              report_id: 'TR',
            },
          ],
          sushi_services: [
            {
              counter_release: '5',
              url: 'https://mocked-registry.localhost/v1/sushi-service/21f2d1ed-76fe-4ecc-b939-83209f3de125/?format=json',
            },
          ],
        },
      ])
    ),
    http.get(
      'https://mocked-registry.localhost/v1/sushi-service/38641ece-a528-4296-b18f-64762e7adfe6',
      () =>
        // Valid service
        HttpResponse.json({
          api_key_required: false,
          counter_release: '5.1',
          last_audit: {
            audit_status: 'Audit in progress',
          },
          platform_attr_required: false,
          platform_specific_info: '',
          requestor_id_required: true,
          url: 'https://journals.aom.org/r51',
        })
    ),
    http.get(
      'https://mocked-registry.localhost/v1/sushi-service/21f2d1ed-76fe-4ecc-b939-83209f3de125',
      () =>
        // Invalid service (audit status)
        HttpResponse.json({
          api_key_required: false,
          counter_release: '5',
          last_audit: {
            audit_status: 'No audit',
          },
          platform_attr_required: false,
          platform_specific_info: '',
          requestor_id_required: true,
          url: 'https://journals.aom.org/',
        })
    ),
    http.get('https://error-registry.localhost/v1/platform', () =>
      HttpResponse.json({ message: 'Something went wrong' }, { status: 500 })
    ),
    http.get('https://network-registry.localhost/v1/platform', () =>
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

  it('should fetch data to sync hosts', async () => {
    expect.assertions(3);

    const remote = new CounterRegistryRemote({
      baseURL: 'https://mocked-registry.localhost/',
      retry: 0,
      retryDelay: 0,
      timeout: 0,
    });

    const hosts = await Array.fromAsync(remote.fetchHostSyncData());

    expect(hosts[0]).toHaveProperty('name', 'Academy of Management (AOM)');
    expect(hosts[0].availableReleases[0]).toHaveProperty('release', '5.1');
    expect(hosts[0].availableReleases[0].availableReports[0]).toHaveProperty(
      'reportId',
      'pr'
    );
  });

  it('should skip invalid hosts', async () => {
    expect.assertions(1);

    const remote = new CounterRegistryRemote({
      baseURL: 'https://mocked-registry.localhost/',
      retry: 0,
      retryDelay: 0,
      timeout: 0,
    });

    const hosts = await Array.fromAsync(remote.fetchHostSyncData());

    expect(hosts[1]).toBeUndefined();
  });

  it('should skip invalid services', async () => {
    expect.assertions(1);

    const remote = new CounterRegistryRemote({
      baseURL: 'https://mocked-registry.localhost/',
      retry: 0,
      retryDelay: 0,
      timeout: 0,
    });

    const hosts = await Array.fromAsync(remote.fetchHostSyncData());

    expect(hosts[0].availableReleases[1]).toBeUndefined();
  });

  it('should throw on error from remote', async () => {
    expect.hasAssertions();
    const remote = new CounterRegistryRemote({
      baseURL: 'https://error-registry.localhost/',
      retry: 0,
      retryDelay: 0,
      timeout: 0,
    });

    const promise = Array.fromAsync(remote.fetchHostSyncData());

    await expect(promise).rejects.toThrow('Internal Server Error');
  });

  it('should throw on error from client', async () => {
    expect.hasAssertions();
    const remote = new CounterRegistryRemote({
      baseURL: 'https://network-registry.localhost/',
      retry: 0,
      retryDelay: 0,
      timeout: 0,
    });

    const promise = Array.fromAsync(remote.fetchHostSyncData());

    await expect(promise).rejects.toThrow('Failed to fetch');
  });
});
