import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

import type { PrismaClient } from '@ezcounter/database/types';

export const dbClient = mockDeep<PrismaClient>();

export const dbPing = vi.fn();

// // Mock functions
// function mockCreateMany<
//   Type extends Record<string, unknown> = Record<string, unknown>,
// >(query: { data: Type | Type[] } | undefined): { count: number } {
//   if (!query?.data) {
//     return { count: 0 };
//   }

//   const { length } = Array.isArray(query.data) ? query.data : [query.data];
//   return { count: length };
// }

// function mockCreateManyAndReturn<
//   Type extends Record<string, unknown> = Record<string, unknown>,
// >(
//   query: { data: Type | Type[] } | undefined,
//   defaultValue?: Partial<Type>
// ): Type[] {
//   if (!query?.data) {
//     return [];
//   }

//   const data = Array.isArray(query.data) ? query.data : [query.data];

//   return data.map(
//     (item) =>
//       Object.fromEntries(
//         Object.entries({ ...defaultValue, ...item }).map(([key, value]) => [
//           key,
//           value ?? defaultValue?.[key],
//         ])
//       ) as Type
//   );
// }

// // Harvest jobs mocks
// beforeAll(() => {
//   const defaultJob: Partial<Prisma.HarvestJobCreateManyInput> = {
//     periodFormat: 'yyyy-MM-dd',
//     params: {},
//     paramsSeparator: '|',
//     timeout: 60000,
//     forceDownload: false,
//     download: { done: false },
//     extract: { done: false },
//   };

//   dbClient.harvestJob.createMany.mockImplementation(
//     (query) =>
//       // oxlint-disable-next-line prefer-await-to-then
//       Promise.resolve(mockCreateMany(query)) as Prisma.PrismaPromise<{
//         count: number;
//       }>
//   );
// });
