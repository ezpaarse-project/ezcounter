export * from './create';
export * from './read';
export * from './update';

export type DataHostReleaseID = {
  dataHostId: string;
  release: '5' | '5.1';
};
