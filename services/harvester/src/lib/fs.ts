import { access } from 'node:fs/promises';

export { stat, unlink } from 'node:fs/promises';
export { createWriteStream, createReadStream } from 'node:fs';

/**
 * Check if file exists at path
 *
 * @param path - Path to file
 *
 * @returns If file exists
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
