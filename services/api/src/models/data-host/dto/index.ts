import type {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
} from './read';

export * from './create';
export * from './read';
export * from './update';

/**
 * Type for a data host supported release including supported data
 */
export type DataHostSupportedReleaseWithSupportedData =
  DataHostSupportedRelease & {
    supportedReports: DataHostSupportedReport[];
  };

/**
 * Type for a data host including supported data
 */
export type DataHostWithSupportedData = DataHost & {
  supportedReleases: DataHostSupportedReleaseWithSupportedData[];
};
