import { parse, stringify } from '@ipld/dag-json';

export function assert(
  condition: unknown,
  message?: string,
): asserts condition {
  if (!condition) {
    throw new Error(message ?? 'assertion failed');
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assertMatches(a: any, b: any, obj: string, field: string) {
  assert(
    a === b,
    `Invalid signed ${obj} (${field}: ${JSON.stringify(a)}, ${JSON.stringify(
      b,
    )})`,
  );
}

// The `CanvasSignedData` and `Session` objects may contain data that cannot be
// automatically serialized by JSON, e.g. Uint8Array. We are using the IPLD dag-json codec
// to serialize and deserialize these objects.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const serializeCanvas = (data: any): string => {
  return stringify(data);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deserializeCanvas = (serializedData: string): any => {
  return parse(serializedData);
};
