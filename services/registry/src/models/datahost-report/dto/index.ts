export * from './create';
export * from './read';
export * from './update';

export type DataHostReportID = {
  dataHostId: string;
  release: '5' | '5.1';
  reportId: string;
};
