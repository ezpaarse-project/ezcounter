import type { HeartbeatConnectedServicePing } from '../dto';

export const mandatoryServices = new Map<string, boolean>();

/**
 * Setup wrapper around a function that will ping connected service, while noting result as a mandatory service
 *
 * @param name - The name of the service
 * @param pinger - How to ping connected service
 *
 * @returns Function to ping connected service while updating mandatory services
 */
export const mandatoryService =
  (
    name: string,
    pinger: HeartbeatConnectedServicePing
  ): HeartbeatConnectedServicePing =>
  async () => {
    try {
      const beat = await pinger();
      mandatoryServices.set(name, true);
      return beat;
    } catch (error) {
      mandatoryServices.set(name, false);
      throw error;
    }
  };

/**
 * Get mandatory services (defined using `mandatoryService`) that didn't sent an heartbeart
 *
 * @returns The missing services
 */
export const getMissingMandatoryServices = (): string[] =>
  [...mandatoryServices.entries()]
    .filter(([, value]) => !value)
    .map(([key]) => key);
