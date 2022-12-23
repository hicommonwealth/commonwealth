import { Request, Response } from 'express';
import { ValidationError } from 'express-validator';
import { AddressInstance } from './models/address';
import { UserInstance } from './models/user';

export type TypedRequestQuery<
  Q extends Record<string, unknown> = Record<string, unknown>
> = Express.Request & {
  user?: Express.User & UserInstance;
  address?: AddressInstance;
  query: Q;
}

export type TypedRequestBody<
  B extends Record<string, unknown> = Record<string, unknown>
> = Express.Request & {
  user?: Express.User & UserInstance;
  address?: AddressInstance;
  body: B;
}

export type TypedRequest<
  B extends Record<string, unknown> = Record<string, unknown>,
  Q extends Record<string, unknown> = Record<string, unknown>
> = Express.Request & {
  user?: Express.User & UserInstance;
  address?: AddressInstance;
  body?: B;
  query?: Q;
}

export type TypedResponse<T> = Response<{ result: T | ValidationError[] } & { status: 'Success' | 'Failure' | number }>;

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
      // TODO: session is used in logout.ts -> remove?
      session: any;
      sessionID: any;
    }
  }
}
