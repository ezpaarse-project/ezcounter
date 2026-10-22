// oxlint-disable import/extensions
export { filter as jsonFilter } from 'stream-json/filters/filter.js';
export { ignore as jsonIgnore } from 'stream-json/filters/ignore.js';
export { pick as jsonPick } from 'stream-json/filters/pick.js';
export { parser as jsonParser } from 'stream-json/parser.js';
export { streamArray as jsonStreamArray } from 'stream-json/streamers/stream-array.js';
export { streamValues as jsonStreamValues } from 'stream-json/streamers/stream-values.js';
// oxlint-enable import/extensions

export type JSONToken = {
  name: 'startArray' | 'endArray' | 'keyValue';
  value: unknown;
};

export type JSONStreamItem = {
  key: number | string;
  value: unknown;
};
