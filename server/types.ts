import { Response } from 'express';
import { UserInstance } from './models/user';

export interface TypedRequestQuery<
  Q extends Record<string, unknown> = Record<string, unknown>
> extends Express.Request {
  user?: Express.User & UserInstance;
  query?: Q;
}

export interface TypedRequestBody<
  B extends Record<string, unknown> = Record<string, unknown>
> extends Express.Request {
  user?: Express.User & UserInstance;
  body?: B;
}

export interface TypedRequest<
  B extends Record<string, unknown> = Record<string, unknown>,
  Q extends Record<string, unknown> = Record<string, unknown>
> extends Express.Request {
  user?: Express.User & UserInstance;
  body?: B;
  query?: Q;
}

export interface TypedResponse<T> extends Response<{ result: T } & { status: 'Success' | 'Failure' }> {

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
    }
  }
}
