import { z } from '@ezcounter/dto';
import { Heartbeat as CommonHeartbeat } from '@ezcounter/heartbeats/dto';

export const Heartbeat = z.object({
  ...CommonHeartbeat.shape,

  createdAt: z.date(),
});

export type Heartbeat = z.infer<typeof Heartbeat>;
