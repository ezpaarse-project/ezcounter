import type { EnrichJobData } from '@ezcounter/dto/queues';

export async function enrichReportItem(
  __: EnrichJobData
): Promise<Record<string, unknown>> {
  return {};
}
