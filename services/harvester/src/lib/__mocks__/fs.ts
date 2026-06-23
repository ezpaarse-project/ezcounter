import { fs } from 'memfs';
import { vi } from 'vitest';

export const createWriteStream = vi.fn<typeof fs.createWriteStream>(
  fs.createWriteStream
);

export const createReadStream = vi.fn<typeof fs.createReadStream>(
  fs.createReadStream
);

export const stat = vi.fn<typeof fs.promises.stat>(fs.promises.stat);

export const unlink = vi.fn<typeof fs.promises.unlink>(fs.promises.unlink);

export const mkdir = vi.fn<typeof fs.promises.mkdir>(fs.promises.mkdir);

export const access = vi.fn<typeof fs.promises.access>(fs.promises.access);

export const exists = vi.fn<(path: string) => Promise<boolean>>(
  async (path) => {
    try {
      await fs.promises.access(path);
      return true;
    } catch {
      return false;
    }
  }
);
