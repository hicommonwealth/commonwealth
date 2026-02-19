// Source: https://github.com/Simspace/monorail/blob/master/src/sharedHelpers/typeGuards.ts

/**
 * Generic undefinedable type for unions with `undefined`
 */
export type Undefinedable<A> = A | undefined;

/**
 * A type representing either null or undefined
 */
export type Nil = null | undefined;

/**
 * Tests whether or not an argument is null (type guard)
 */
export const isNull = (x: unknown): x is null => x === null;

/**
 * Tests whether or not an argument is undefined (type guard)
 */
export const isUndefined = (x: unknown): x is undefined => x === undefined;

/**
 * Tests whether or not an argument is not undefined (type guard)
 */
export const isNotUndefined = <T>(
  x: Undefinedable<T>,
): x is Exclude<T, undefined> => !isUndefined(x);

/**
 * Tests whether or not an argument is null or undefined (type guard)
 */
export const isNil = (x: unknown): x is Nil => isNull(x) || isUndefined(x);

/**
 * Tests whether or not an argument is null or undefined (type guard)
 */
export const isNotNil = <T>(x: T | Nil): x is T => !isNil(x);

export const isBoolean = (x: unknown): x is boolean =>
  x === true || x === false;

/**
 * Type guard for the `true` literal of the `boolean` primitive
 */
export const isTrue = (x: unknown): x is true =>
  typeof x === 'boolean' && x === true;

/**
 * Type guard for the `number` primitive
 */
export const isNumber = (x: unknown): x is number => typeof x === 'number';

/**
 * Type guard for the `0` literal of the `number` primitive
 */
export const isZero = (x: unknown): x is 0 => isNumber(x) && x === 0;

/**
 * Type guard for the `string` primitive
 */
export const isString = (x: unknown): x is string => typeof x === 'string';

/**
 * Type guard for the `''` literal of the `string` primitive
 */
export const isEmptyString = (x: unknown): x is '' => isString(x) && x === '';

/**
 * Type guard for `string` primitives that are not `''`
 */
export const isNonEmptyString = (x: unknown): x is string =>
  isString(x) && !isEmptyString(x);
