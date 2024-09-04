import {
  analytics,
  logger,
  stats,
  type Actor,
  type AuthStrategies,
  type User,
} from '@hicommonwealth/core';
import { TRPCError, initTRPC } from '@trpc/server';
import { Request, Response } from 'express';
import passport from 'passport';
import { OpenApiMeta } from 'trpc-swagger';
import { ZodSchema, z } from 'zod';
import { config } from '../config';

const log = logger(import.meta);

type Metadata<Input extends ZodSchema, Output extends ZodSchema> = {
  readonly input: Input;
  readonly output: Output;
  auth: unknown[];
  secure?: boolean;
  authStrategy?: AuthStrategies;
};

const isSecure = (md: Metadata<ZodSchema, ZodSchema>) =>
  md.secure !== false || (md.auth ?? []).length > 0;

export interface Context {
  req: Request;
  res: Response;
  actor: Actor;
}

const trpc = initTRPC.meta<OpenApiMeta>().context<Context>().create();
export const router = trpc.router;
export const procedure = trpc.procedure;

export enum Tag {
  User = 'User',
  Community = 'Community',
  Thread = 'Thread',
  Topic = 'Topic',
  Comment = 'Comment',
  Reaction = 'Reaction',
  Integration = 'Integration',
  Subscription = 'Subscription',
  LoadTest = 'LoadTest',
  Wallet = 'Wallet',
  Webhook = 'Webhook',
}

export type Track<Output extends ZodSchema> = [
  string,
  mapper?: (result: z.infer<Output>) => Record<string, unknown>,
];

/**
 * tRPC procedure factory with authentication, traffic stats, and analytics middleware
 */
export const buildproc = <Input extends ZodSchema, Output extends ZodSchema>(
  method: 'GET' | 'POST',
  name: string,
  md: Metadata<Input, Output>,
  tag: Tag,
  track?: Track<Output>,
) => {
  const secure = isSecure(md);
  return trpc.procedure
    .use(async ({ ctx, next }) => {
      if (secure) await authenticate(ctx.req, md.authStrategy);
      return next({
        ctx: {
          ...ctx,
          actor: {
            user: ctx.req.user as User,
            address: ctx.req.headers['address'] as string,
          },
        },
      });
    })
    .use(async ({ ctx, next }) => {
      const start = Date.now();
      const result = await next();
      const latency = Date.now() - start;
      try {
        const path = `${ctx.req.method.toUpperCase()} ${ctx.req.path}`;
        stats().increment('cw.path.called', { path });
        stats().histogram(`cw.path.latency`, latency, {
          path,
          statusCode: ctx.res.statusCode.toString(),
        });
      } catch (err) {
        err instanceof Error && log.error(err.message, err);
      }
      if (track && result.ok) {
        try {
          analytics().track(track[0], {
            userId: ctx.actor.user.id,
            ...(track[1] ? track[1](result.data) : {}),
          });
        } catch (err) {
          err instanceof Error && log.error(err.message, err);
        }
      }
      return result;
    })
    .meta({
      openapi: {
        method,
        path: `/${name}`,
        tags: [tag],
        headers: [
          {
            in: 'header',
            name: 'address',
            required: false,
            schema: { type: 'string' },
          },
        ],
        protect: secure,
      },
    })
    .input(md.input)
    .output(md.output);
};

const authenticate = async (
  req: Request,
  authStrategy: AuthStrategies = { name: 'jwt' },
) => {
  try {
    if (authStrategy.name === 'authtoken') {
      switch (req.headers['authorization']) {
        case config.NOTIFICATIONS.KNOCK_AUTH_TOKEN:
          req.user = {
            id: authStrategy.userId,
            email: 'hello@knock.app',
          };
          break;
        case config.LOAD_TESTING.AUTH_TOKEN:
          req.user = {
            id: authStrategy.userId,
            email: 'info@grafana.com',
          };
          break;
        default:
          throw new Error('Not authenticated');
      }
    } else if (authStrategy.name === 'custom') {
      authStrategy.customStrategyFn(req);
      req.user = {
        id: authStrategy.userId,
      };
    } else {
      await passport.authenticate(authStrategy.name, { session: false });
    }

    if (!req.user) throw new Error('Not authenticated');
    if (authStrategy.userId && (req.user as User).id !== authStrategy.userId) {
      throw new Error('Not authenticated');
    }
  } catch (error) {
    throw new TRPCError({
      message: error instanceof Error ? error.message : (error as string),
      code: 'UNAUTHORIZED',
    });
  }
};
