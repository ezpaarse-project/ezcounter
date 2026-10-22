import { addAbortSignal } from 'node:stream';

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
export function attachAbortSignal<
  Flow extends
    | NodeJS.ReadableStream
    | NodeJS.WritableStream
    | ReadableStream
    | WritableStream,
>(stream: Flow, signal: AbortSignal | undefined): Flow {
  if (signal) {
    addAbortSignal(signal, stream);
  }
  return stream;
}
