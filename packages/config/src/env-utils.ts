/**
 * Keys that can be present to represent a duration
 */
const durationKeys = [
  'years',
  'months',
  'weeks',
  'days',
  'hours',
  'minutes',
  'seconds',
  // Milliseconds are not supported by `date-fns` but can be used in some cases
  'milliseconds',
] as const;

/**
 * Field of `custom-environment-variables` definition
 *
 * @see https://github.com/node-config/node-config/wiki/Environment-Variables
 */
type EnvOfField<Field> = Field extends string
  ? string
  : {
      __name: string;
      __format: Field extends boolean
        ? 'boolean'
        : Field extends number
          ? 'number'
          : string;
    };

/**
 * `custom-environment-variables` definition, supports nested config
 *
 * @see https://github.com/node-config/node-config/wiki/Environment-Variables
 */
export type EnvOfConfig<Config> =
  Config extends Record<string, unknown>
    ? {
        [key in keyof Config]?: EnvOfConfig<Config[key]>;
      }
    : EnvOfField<Config>;

/**
 * Define environment variables for a string
 *
 * @param name - The name of the environment variable
 *
 * @returns An object defining the environment variable
 */
export const defineString = (name: string): EnvOfField<string> => name;

/**
 * Define environment variables for a boolean
 *
 * @param name - The name of the environment variable
 *
 * @returns An object defining the environment variable
 */
export const defineBoolean = (name: string): EnvOfField<boolean> => ({
  __format: 'boolean',
  __name: name,
});

/**
 * Define environment variables for a number
 *
 * @param name - The name of the environment variable
 *
 * @returns An object defining the environment variable
 */
export const defineNumber = (name: string): EnvOfField<number> => ({
  __format: 'number',
  __name: name,
});

/**
 * Define environment variables for a JSON field
 *
 * @param name - The name of the environment variable
 *
 * @returns An object defining the environment variable
 */
export const defineJSON = (name: string): EnvOfField<unknown> => ({
  __format: 'json',
  __name: name,
});

/**
 * Define environment variables for a duration
 *
 * @param prefix - The prefix to use for the environment variables
 * @param keys - The keys to use for the environment variables
 *
 * @returns An object defining the environment variables
 */
export const defineDuration = <Keys extends (typeof durationKeys)[number]>(
  prefix: string,
  keys?: Keys[]
): EnvOfConfig<Record<Keys, number>> =>
  Object.fromEntries(
    (keys ?? durationKeys).map((key) => [
      key,
      {
        __format: 'number',
        __name: `${prefix}_${key}`,
      },
    ])
  ) as EnvOfConfig<Record<Keys, number>>;
