import type * as original from 'isbn3';
import { vi } from 'vitest';

// `isbn3` is a commonjs module
export = {
  asIsbn13: vi.fn<typeof original.asIsbn13>((isbn) => isbn),
};
