import { TypedRequestQuery, TypedResponse } from 'server/types';

const expressRequest = ({} as any) as Express.Request;

export function req<T extends Record<string, unknown> = Record<string, unknown>>(r: T): TypedRequestQuery<T> {
  return { query: r, ...expressRequest };
}

export function res<T>(expectedType?: T): TypedResponse<T> {
  return ({json: <T>(t: T) => t} as any) as TypedResponse<T>;
}