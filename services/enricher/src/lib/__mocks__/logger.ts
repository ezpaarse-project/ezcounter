import { mockDeep } from 'vitest-mock-extended';

import type { Logger } from '@ezcounter/logger';

const appLogger = mockDeep<Logger>();
// oxlint-disable-next-line vitest/require-hook
appLogger.child.mockReturnValue(mockDeep());

const accessLogger = mockDeep<Logger>();
// oxlint-disable-next-line vitest/require-hook
accessLogger.child.mockReturnValue(mockDeep());

export { appLogger, accessLogger };
