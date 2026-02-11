import { addAbortSignal, type Readable, type Stream } from 'node:stream';

/**
 * Wait for a stream to emit a `data` event, a `end` event, or a `error` event
 *
 * @param stream - The stream to wait
 *
 * @returns the data emitted by stream
 */
export const waitForStreamData = <Type>(
  stream: Readable
): Promise<Type | null> =>
  // oxlint-disable-next-line promise/avoid-new
  new Promise((resolve, reject) => {
    stream.on('data', (data) => resolve(data));
    stream.on('end', () => resolve(null));
    stream.on('error', (err) => reject(err));
  });

/**
 * Wait for a stream to emit a `end` event, or a `error` event
 *
 * @param stream - The stream to wait
 */
export const waitForStreamEnd = (stream: Stream): Promise<void> =>
  // oxlint-disable-next-line promise/avoid-new
  new Promise((resolve, reject) => {
    stream.on('end', () => resolve());
    stream.on('error', (err) => reject(err));
  });

/**
 * Attach AbortSignal (if provided) to stream
 *
 * @param stream - The stream
 * @param signal - The signal
 *
 * @see addAbortSignal
 *
 * @returns The stream
 */
export function attachAbortSignal<Flow extends Stream>(
  stream: Flow,
  signal: AbortSignal | undefined
): Flow {
  if (signal) {
    addAbortSignal(signal, stream);
  }
  return stream;
}
