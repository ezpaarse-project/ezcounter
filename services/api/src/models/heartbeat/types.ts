import { Heartbeat as CommonHeartbeat } from '@ezcounter/heartbeats/types';
import { z } from '@ezcounter/models/lib/zod';

export const Heartbeat = z.object({
  ...CommonHeartbeat.shape,

  createdAt: z.date(),
});

export type Heartbeat = z.infer<typeof Heartbeat>;
