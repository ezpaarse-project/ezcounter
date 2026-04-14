import type { EventEmitter } from 'node:events';

export type HeartbeatSender = EventEmitter<{
  send: [];
  'send:main': [];
  'send:connected': [string];
}>;
