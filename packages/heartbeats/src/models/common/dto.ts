import { z } from '@ezcounter/dto';

const UNAVAILABLE = -1;

export const FileSystemUsage = z.object({
  available: z.int().min(UNAVAILABLE).describe('Available space in bytes'),

  name: z.string().min(1).describe('Filesystem name'),

  total: z.int().min(UNAVAILABLE).describe('Total space in bytes'),

  used: z.int().min(UNAVAILABLE).describe('Used space in bytes'),
});

export type FileSystemUsage = z.infer<typeof FileSystemUsage>;

export const Heartbeat = z.object({
  filesystems: z
    .array(FileSystemUsage)
    .min(1)
    .optional()
    .describe('Filesystems used by the service'),

  hostname: z.string().min(1).describe('Hostname of the service'),

  nextAt: z.coerce.date().describe('When the next heartbeat should happen'),

  service: z.string().min(1).describe('Service sending the heartbeat'),

  updatedAt: z.coerce.date().describe('Creation date of heartbeat'),

  version: z.string().min(1).optional().describe('Version of the service'),
});

export type Heartbeat = z.infer<typeof Heartbeat>;

export type HeartbeatConnectedServicePing = () => Promise<
  Omit<Heartbeat, 'nextAt' | 'updatedAt'>
>;

export type HeartbeatService = {
  name: string;
  version: string;
  filesystems?: Record<string, string>;
  connectedServices?: Record<string, HeartbeatConnectedServicePing>;
};

export type HeartbeatFrequency = {
  self: number;
  connected: {
    min: number;
    max: number;
  };
};
