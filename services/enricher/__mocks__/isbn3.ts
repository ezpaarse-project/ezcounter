import type * as original from 'isbn3';
import { vi } from 'vitest';

export const asIsbn13 = vi.fn<typeof original.asIsbn13>((isbn) => isbn);
