import { fs } from 'memfs';
import { vi } from 'vitest';

export const createWriteStream = vi.fn(fs.createWriteStream);

export const createReadStream = vi.fn(fs.createReadStream);

export const stat = vi.fn(fs.promises.stat);

export const unlink = vi.fn(fs.promises.unlink);

export const mkdir = vi.fn(fs.promises.mkdir);

export const access = vi.fn(fs.promises.access);

export const exists = vi.fn(async (path: string): Promise<boolean> => {
  try {
    await fs.promises.access(path);
    return true;
  } catch {
    return false;
  }
});
