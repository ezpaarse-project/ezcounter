import { mockDeep } from 'vitest-mock-extended';

import type { Logger } from '@ezcounter/logger';

const appLogger = mockDeep<Logger>();
appLogger.child.mockReturnValue(mockDeep());

const accessLogger = mockDeep<Logger>();
accessLogger.child.mockReturnValue(mockDeep());

export { appLogger, accessLogger };
