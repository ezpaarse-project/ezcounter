import { vi } from 'vitest';

import type * as original from '..';

export const doesDataHostExists = vi.fn<typeof original.doesDataHostExists>();

export const findAllDataHost = vi.fn<typeof original.findAllDataHost>();

export const doesDataHostSupportsRelease =
  vi.fn<typeof original.doesDataHostSupportsRelease>();

export const findAllReleasesSupportedByDataHost =
  vi.fn<typeof original.findAllReleasesSupportedByDataHost>();

export const doesDataHostSupportsReport =
  vi.fn<typeof original.doesDataHostSupportsReport>();

export const findAllReportsSupportedByDataHost =
  vi.fn<typeof original.findAllReportsSupportedByDataHost>();

export const getDataHostWithSupportedData =
  vi.fn<typeof original.getDataHostWithSupportedData>();

export const upsertDataHost = vi.fn<typeof original.upsertDataHost>();

export const upsertReleaseSupportedByDataHost =
  vi.fn<typeof original.upsertReleaseSupportedByDataHost>();

export const upsertReportSupportedByDataHost =
  vi.fn<typeof original.upsertReportSupportedByDataHost>();

export const deleteDataHost = vi.fn<typeof original.deleteDataHost>();

export const deleteReleaseSupportedByDataHost =
  vi.fn<typeof original.deleteReleaseSupportedByDataHost>();

export const deleteReportSupportedByDataHost =
  vi.fn<typeof original.deleteReportSupportedByDataHost>();
