import type { Logger } from 'pino';
import { mockDeep } from 'vitest-mock-extended';

const appLogger = mockDeep<Logger>();
// oxlint-disable-next-line vitest/require-hook
appLogger.child.mockReturnValue(mockDeep());

const accessLogger = mockDeep<Logger>();
// oxlint-disable-next-line vitest/require-hook
accessLogger.child.mockReturnValue(mockDeep());

export { appLogger, accessLogger };
