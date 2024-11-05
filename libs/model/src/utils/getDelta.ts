type Delta<T> = Partial<{
  [K in keyof T]: T[K] extends Date
    ? T[K]
    : T[K] extends object
      ? Delta<T[K]>
      : T[K] extends Array<infer U>
        ? Array<U>
        : T[K];
}>;

/**
 * Gets delta in field values between two objects
 * @param target target object
 * @param source source object with values to check against target
 * @returns object representing the delta between source and target
 *
 * @example
 * ```typescript
 * const target = {
 *   name: 'Alice',
 *   age: 30,
 *   skills: ['JavaScript', 'TypeScript'],
 *   address: { city: 'Wonderland', zip: 12345 },
 * };
 *
 * const source = {
 *   name: 'Alice',
 *   age: 31,
 *   skills: ['JavaScript', 'TypeScript', 'React'],
 *   address: { city: 'Wonderland', zip: 54321 },
 * };
 *
 * const delta = getDelta(target, source);
 * console.log(delta);
 * ```
 */
export function getDelta<T extends object>(
  target: T,
  source: Partial<T>,
): Delta<T> {
  const delta = {} as Delta<T>;

  for (const key in source) {
    const source_field = source[key];
    const target_field = target[key];

    if (typeof source_field !== 'undefined') {
      if (Array.isArray(source_field)) {
        JSON.stringify(target_field) !== JSON.stringify(source_field) &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (delta[key] = source_field as any);
      } else if (source_field instanceof Date && target_field instanceof Date) {
        if (target_field.getTime() !== source_field.getTime())
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delta[key] = source_field as any;
      } else if (typeof source_field === 'object') {
        const key_delta = getDelta(target_field ?? {}, source_field as object);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.keys(key_delta).length && (delta[key] = key_delta as any);
      } else if (target_field !== source_field)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delta[key] = source_field as any;
    }

    // DEBUG: keep comment
    // console.log({ target, source, delta });
  }

  return delta;
}
