import { configure } from 'safe-stable-stringify';

export const CANVAS_TOPIC = 'canvas:commonwealth';

export function assert(
  condition: unknown,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new Error(message ?? 'assertion failed');
  }
}

export function assertMatches(a, b, obj: string, field: string) {
  assert(
    a === b,
    `Invalid signed ${obj} (${field}: ${JSON.stringify(a)}, ${JSON.stringify(
      b,
    )})`,
  );
}

export const stringify = configure({
  bigint: false,
  circularValue: Error,
  strict: true,
  deterministic: true,
});

export const caip2AddressEquals = (address1: string, address2: string) =>
  address1 === address2;
