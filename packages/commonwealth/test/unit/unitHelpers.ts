import type { TypedRequestQuery, TypedResponse } from 'server/types';

// helper methods to be able to call individual methods assigned to the express router. Used to avoid type errors
const expressRequest = {} as never as Express.Request;

export function req<
  T extends Record<string, unknown> = Record<string, unknown>
>(r: T): TypedRequestQuery<T> {
  return { query: r, ...expressRequest };
}

export function res<T>(): TypedResponse<T> {
  return { json: (t: T) => t } as never as TypedResponse<T>;
}
