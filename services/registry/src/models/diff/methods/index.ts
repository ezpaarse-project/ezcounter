import { flattenObject } from 'es-toolkit/object';
import { diff, isEqual } from 'ohash/utils';

import type { DiffEntry } from '../dto';

/**
 * Flattens a nested object into a single level object
 *
 * @param object - The object to flatten
 *
 * @returns The flattened object
 */
export const flatten = (
  object: Record<string, unknown>
): Record<string, unknown> =>
  flattenObject(object, { delimiter: '.', preserveArrays: false });

/**
 * Transform a flattened object into a nested object
 *
 * Derived from https://stackoverflow.com/a/42696154
 *
 * @param object - The flattened object
 *
 * @returns The nested object
 */
export function unflatten(
  object: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(object)) {
    const subKeys = key.split('.');

    let target: Record<string, unknown> = result;

    for (let index = 0; index < subKeys.length; index += 1) {
      const subKey = subKeys[index];

      if (!target[subKey]) {
        if (Number.isNaN(Number(subKeys[index + 1]))) {
          target[subKey] = subKeys.length - 1 === index ? object[key] : {};
        } else {
          target[subKey] = [];
        }
      }

      target = target[subKey] as Record<string, unknown>;
    }
  }

  return result;
}

/**
 * Wrapper around ohash to check if two object's hash are equal
 *
 * @param obj1 First object
 * @param obj2 Second object
 *
 * @returns `true` if equal and `false` if not
 */
export const areHashEqual = (
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>
): boolean => isEqual(obj1, obj2);

/**
 *  Wrapper around ohash to calculate the differences between two objects and returns a list of differences
 *
 * @param obj1 The first object to compare
 * @param obj2 The second object to compare
 *
 * @returns An array with the differences between the two objects.
 */
export const objectDiff = (
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>
): DiffEntry[] =>
  diff(obj1, obj2).map((entry) => {
    switch (entry.type) {
      case 'removed':
        return {
          key: entry.key,
          oldValue: {
            key: entry.oldValue!.key,
            value: entry.oldValue!.value,
          },
          type: entry.type,
        };

      case 'added':
        return {
          key: entry.key,
          newValue: {
            key: entry.newValue!.key,
            value: entry.newValue!.value,
          },
          type: entry.type,
        };

      default:
        return {
          key: entry.key,
          newValue: {
            key: entry.newValue!.key,
            value: entry.newValue!.value,
          },
          oldValue: {
            key: entry.oldValue!.key,
            value: entry.oldValue!.value,
          },
          type: entry.type,
        };
    }
  });

/**
 * Transform target to apply diff
 *
 * @param target The target to update
 * @param entries The changes to apply
 *
 * @returns A new object with updated properties
 */
export function applyDiff<Target extends Record<string, unknown>>(
  target: Target,
  entries: DiffEntry[]
): Target {
  const properties = new Map(Object.entries(flatten(target)));

  for (const entry of entries) {
    if (
      entry.type === 'removed' ||
      (entry.type === 'changed' && entry.oldValue.key !== entry.newValue.key)
    ) {
      properties.delete(entry.oldValue.key);
    }

    if (entry.type === 'added' || entry.type === 'changed') {
      properties.set(entry.newValue.key, entry.newValue.value);
    }
  }

  return unflatten(Object.fromEntries(properties)) as Target;
}
