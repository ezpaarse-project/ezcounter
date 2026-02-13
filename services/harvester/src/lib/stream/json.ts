import Parser from 'stream-json/Parser';

import Pick from 'stream-json/filters/Pick';
import Filter from 'stream-json/filters/Filter';
import Ignore from 'stream-json/filters/Ignore';

import StreamValues from 'stream-json/streamers/StreamValues';
import StreamArray from 'stream-json/streamers/StreamArray';

export type JSONToken = {
  name: 'startArray' | 'endArray' | 'keyValue';
  value: unknown;
};

export type JSONStreamedValue = {
  key: number | string;
  value: unknown;
};

// Simplify exports
export const jsonParser = Parser.parser;
export const jsonPick = Pick.pick;
export const jsonFilter = Filter.filter;
export const jsonIgnore = Ignore.ignore;
export const jsonStreamValues = StreamValues.streamValues;
export const jsonStreamArray = StreamArray.streamArray;
