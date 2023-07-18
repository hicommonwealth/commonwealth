import type { Response } from 'express';
import type { ValidationError } from 'express-validator';
import type { AddressInstance } from './models/address';
import type { ChainInstance } from './models/chain';
import type { UserInstance } from './models/user';

export type PaginationQueryParams = {
  limit?: string;
  page?: string;
  order_by?: string;
  order_direction?: string;
};

export type TypedPaginatedResult<T> = {
  results: T[];
  limit: number;
  page: number;
  totalPages: number;
  totalResults: number;
};

export type TypedRequestQuery<
  Q extends Record<string, unknown> = Record<string, unknown>
> = Express.Request & {
  user?: Express.User & UserInstance;
  address?: AddressInstance;
  chain?: ChainInstance;
  query: Q;
};

export type TypedRequestBody<
  B extends Record<string, unknown> = Record<string, unknown>
> = Express.Request & {
  user?: Express.User & UserInstance;
  address?: AddressInstance;
  chain?: ChainInstance;
  body: B;
};

export type TypedRequestParams<
  P extends Record<string, unknown> = Record<string, unknown>
> = Express.Request & {
  user?: Express.User & UserInstance;
  address?: AddressInstance;
  chain?: ChainInstance;
  params: P;
};

export type TypedRequest<
  B extends Record<string, unknown> = Record<string, unknown>,
  Q extends Record<string, unknown> = Record<string, unknown>,
  P extends Record<string, unknown> = Record<string, unknown>
> = Express.Request & {
  user?: Express.User & UserInstance;
  address?: AddressInstance;
  chain?: ChainInstance;
  body?: B;
  query?: Q;
  params?: P;
};

export type TypedResponse<T> = Response<
  { result: T | ValidationError[] } & { status: 'Success' | 'Failure' | number }
>;

export function success<T>(res: TypedResponse<T>, result: T) {
  return res.json({
    status: 'Success',
    result,
  });
}

export function failure<T>(res: TypedResponse<any>, result: T) {
  return res.json({
    status: 'Failure',
    result,
  });
}

// TODO: legacy overrides, convert all routes and remove
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User extends UserInstance {
      [key: string]: any;
    }

    interface Request {
      user?: User;
      address?: AddressInstance;
      chain?: ChainInstance;
      // TODO: session is used in logout.ts -> remove?
      session: any;
      sessionID: any;
    }
  }
}
