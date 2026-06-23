import type {
  Heartbeat,
  HeartbeatConnectedServicePing,
  HeartbeatFrequency,
} from '../common/dto';
import { doPingWithTimeout } from '../common';

export class HeartbeatConnectedService {
  #frequency: { last: number; next: number };

  get frequency(): { last: number; next: number } {
    return this.#frequency;
  }

  private timeoutId: NodeJS.Timeout | undefined;

  constructor(
    private readonly ping: HeartbeatConnectedServicePing,
    private readonly frequencyConfig: HeartbeatFrequency['connected']
  ) {
    this.#frequency = { last: 0, next: frequencyConfig.min };
  }

  /**
   * Get service as heartbeat
   *
   * @returns Heartbeat of service
   */
  public async getHeartbeat(): Promise<Heartbeat> {
    const { min, max } = this.frequencyConfig;
    const last = Math.min(this.#frequency.next ?? min, max);
    const next = Math.min(last * 2, max);

    try {
      const service = await doPingWithTimeout(this.ping, last);

      this.#frequency = { last, next };

      return service;
    } catch (error) {
      this.#frequency = { last, next: min };
      throw error;
    }
  }

  /**
   * Schedule handler following frequency
   *
   * @param handler - The handler to schedule
   */
  public scheduleNext(handler: () => void): void {
    this.timeoutId = setTimeout(handler, this.#frequency.next);
  }
}
