import { syncHostsCron } from './sync-hosts';

/**
 * Start all crons defined
 */
export function startCrons(): void {
  syncHostsCron.start();
}
