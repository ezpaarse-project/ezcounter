import type { EventEmitter } from 'node:events';

import type { Heartbeat } from '../common/dto';

export type HeartbeatListener = EventEmitter<{
  heartbeat: [Heartbeat];
}>;
