/**
 * Type for options to provide when refreshing supported data
 */
export type SupportedReportsRefreshOptions = {
  release: '5' | '5.1';
  dryRun?: boolean;
  forceRefresh?: boolean;
};
