import { Heartbeat as CommonHeartbeat } from '@ezcounter/heartbeats/dto';
import { z } from '@ezcounter/dto';

export const Heartbeat = z.object({
  ...CommonHeartbeat.shape,

  createdAt: z.date(),
});

export type Heartbeat = z.infer<typeof Heartbeat>;
