import type {
  DataHost,
  DataHostSupportedRelease,
  DataHostSupportedReport,
} from './read';

export * from './create';
export * from './read';
export * from './update';

/**
 * Type for a data host including supported data
 */
export type DataHostWithSupportedData = DataHost & {
  supportedReleases: (DataHostSupportedRelease & {
    supportedReports: DataHostSupportedReport[];
  })[];
};
