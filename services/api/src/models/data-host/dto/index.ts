export * from './create';
export * from './read';
export * from './update';

export type DataHostSupportedReleaseID = {
  dataHostId: string;
  release: '5' | '5.1';
};
export type DataHostSupportedReportID = {
  dataHostId: string;
  release: '5' | '5.1';
  report: string;
};
