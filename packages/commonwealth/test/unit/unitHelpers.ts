import { TypedRequestBody } from 'server/types';
import type { TypedRequestQuery, TypedResponse } from 'server/types';

// We don't care about express internals when performing unit tests,
// so we just cast it to avoid typescript from complaining
const expressRequest = {} as any as Express.Request;

export function getReq<
  T extends Record<string, unknown> = Record<string, unknown>
>(r: T): TypedRequestQuery<T> {
  return { query: r, ...expressRequest };
}

export function postReq<
  T extends Record<string, unknown> = Record<string, unknown>
>(r: T): TypedRequestBody<T> {
  return { body: r, ...expressRequest };
}

export function res<T>(expectedType?: T): TypedResponse<T> {
  return { json: <R>(r: R) => r } as any as TypedResponse<T>;
}
