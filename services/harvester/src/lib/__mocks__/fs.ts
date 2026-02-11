import { vi } from 'vitest';
import { fs } from 'memfs';

export const createWriteStream = vi
  .fn()
  .mockImplementation(fs.createWriteStream);

export const createReadStream = vi.fn().mockImplementation(fs.createReadStream);

export const stat = vi.fn().mockImplementation(fs.promises.stat);

export const unlink = vi.fn().mockImplementation(fs.promises.unlink);

export const exists = vi
  .fn()
  .mockImplementation(async (path: string): Promise<boolean> => {
    try {
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  });
