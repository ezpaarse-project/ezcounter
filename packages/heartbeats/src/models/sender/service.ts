import { statfs } from 'node:fs/promises';

import type {
  HeartbeatService as CreateHeartbeatService,
  FileSystemUsage,
  Heartbeat,
  HeartbeatFrequency,
} from '../common/dto';
import { NODE_NAME } from '../common';
import { HeartbeatConnectedService } from './connected-service';

// oxlint-disable no-magic-numbers
const DEFAULT_FREQUENCY: HeartbeatFrequency = {
  connected: {
    // Max: 5 mins
    max: 5 * 60 * 1000,
    // Min: 5 seconds
    min: 5 * 1000,
  },

  // Self: 2 seconds
  self: 2 * 1000,
};
// oxlint-enable no-magic-numbers

export class HeartbeatService {
  public readonly name: string;

  public readonly version: string;

  public readonly connectedServices: Map<string, HeartbeatConnectedService>;

  private readonly filesystems: Map<string, string>;

  private timeoutId: NodeJS.Timeout | undefined;

  constructor(
    service: CreateHeartbeatService,
    public readonly frequencyConfig = DEFAULT_FREQUENCY
  ) {
    this.name = service.name;
    this.version = service.version;
    this.connectedServices = new Map(
      Object.entries(service.connectedServices ?? {}).map(([name, ping]) => [
        name,
        new HeartbeatConnectedService(ping, frequencyConfig.connected),
      ])
    );
    this.filesystems = new Map(
      Object.entries(service.filesystems ?? {}).filter(([, path]) => path)
    );
  }

  /**
   * Get status of file
   *
   * @returns The usage of the filesystems defined in service
   */
  public getFilesystemsUsage(): Promise<FileSystemUsage[]> {
    return Promise.all(
      [...this.filesystems].map(async ([name, path]) => {
        const stats = await statfs(path);

        const total = stats.bsize * stats.blocks;
        const available = stats.bavail * stats.bsize;

        return {
          available,
          name,
          total,
          used: total - available,
        };
      })
    );
  }

  /**
   * Get service as heartbeat
   *
   * @returns Heartbeat of service
   */
  public async getHeartbeat(): Promise<Heartbeat> {
    const now = new Date();
    const filesystems = await this.getFilesystemsUsage();

    return {
      filesystems: filesystems.length > 0 ? filesystems : undefined,
      hostname: NODE_NAME,
      nextAt: new Date(now.getTime() + this.frequencyConfig.self),
      service: this.name,
      updatedAt: now,
      version: this.version,
    };
  }

  /**
   * Schedule handler following frequency
   *
   * @param handler - The handler to schedule
   */
  public scheduleNext(handler: () => void): void {
    this.timeoutId = setTimeout(handler, this.frequencyConfig.self);
  }
}
