import { Request, Response } from 'express';
import { UserInstance } from './models/user';

export type TypedRequestQuery<
  Q extends Record<string, unknown> = Record<string, unknown>
> = Express.Request & {
  user?: Express.User & UserInstance;
  query?: Q;
};

export type TypedRequestBody<
  B extends Record<string, unknown> = Record<string, unknown>
> = Express.Request & {
  user?: Express.User & UserInstance;
  body?: B;
};

export type TypedRequest<
  B extends Record<string, unknown> = Record<string, unknown>,
  Q extends Record<string, unknown> = Record<string, unknown>
> = Express.Request & {
  user?: Express.User & UserInstance;
  body?: B;
  query?: Q;
};

export type TypedResponse<T> = Response<
  { result: T } & { status: 'Success' | 'Failure' | number }
>;

export function success<T>(res: TypedResponse<T>, result: T) {
  return res.json({
    status: 'Success',
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

      // TODO: remove these once websocket PR merged!
      session: any;
      sessionID: any;
      wss: any;
    }
  }
}
