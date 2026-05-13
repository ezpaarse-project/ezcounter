import { vi } from 'vitest';

import type * as original from '../../harvest/limits';

export const limitReportOptionsWithSupported = vi.fn<
  typeof original.limitReportOptionsWithSupported
>((report) => report);
