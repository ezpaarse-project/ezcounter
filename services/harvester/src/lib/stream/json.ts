export { parser as jsonParser } from 'stream-json/Parser';

export { pick as jsonPick } from 'stream-json/filters/Pick';
export { filter as jsonFilter } from 'stream-json/filters/Filter';
export { ignore as jsonIgnore } from 'stream-json/filters/Ignore';

export { streamValues as jsonStreamValues } from 'stream-json/streamers/StreamValues';
export { streamArray as jsonStreamArray } from 'stream-json/streamers/StreamArray';

export type JSONToken = {
  name: 'startArray' | 'endArray' | 'keyValue';
  value: unknown;
};

export type JSONStreamedValue = {
  key: number | string;
  value: unknown;
};
