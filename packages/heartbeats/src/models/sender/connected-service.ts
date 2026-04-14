import type {
  Heartbeat,
  HeartbeatConnectedServicePing,
  HeartbeatFrequency,
} from '../common/dto';
import { doPingWithTimeout } from '../common';

export class HeartbeatConnectedService {
  private _frequency: { last: number; next: number };

  get frequency(): { last: number; next: number } {
    return this._frequency;
  }

  private timeoutId: NodeJS.Timeout | undefined;

  constructor(
    private readonly ping: HeartbeatConnectedServicePing,
    private readonly frequencyConfig: HeartbeatFrequency['connected']
  ) {
    this._frequency = { last: 0, next: frequencyConfig.min };
  }

  /**
   * Get service as heartbeat
   *
   * @returns Heartbeat of service
   */
  public async getHeartbeat(): Promise<Heartbeat> {
    const { min, max } = this.frequencyConfig;
    const last = Math.min(this._frequency.next ?? min, max);
    const next = Math.min(last * 2, max);

    try {
      const service = await doPingWithTimeout(this.ping, last);

      this._frequency = { last, next };

      return service;
    } catch (error) {
      this._frequency = { last, next: min };
      throw error;
    }
  }

  /**
   * Schedule handler following frequency
   *
   * @param handler - The handler to schedule
   */
  public scheduleNext(handler: () => void): void {
    this.timeoutId = setTimeout(handler, this._frequency.next);
  }
}
