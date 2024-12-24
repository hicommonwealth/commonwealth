import {
  logger,
  stats,
  type AuthStrategies,
  type User,
} from '@hicommonwealth/core';
import { TRPCError, initTRPC } from '@trpc/server';
import type { Request } from 'express';
import passport from 'passport';
import type { OpenApiMeta } from 'trpc-swagger';
import { ZodSchema, z } from 'zod';
import { config } from '../config';
import type { BuildProcOptions, Context, Metadata } from './types';

const log = logger(import.meta);

const trpc = initTRPC.meta<OpenApiMeta>().context<Context>().create();
export const router = trpc.router;
export const procedure = trpc.procedure;

const isSecure = <Input extends ZodSchema, Output extends ZodSchema>(
  md: Metadata<Input, Output>,
) => md.secure !== false || (md.auth ?? []).length > 0;

const authenticate = async <Input extends ZodSchema>(
  req: Request,
  rawInput: z.infer<Input>,
  authStrategy: AuthStrategies<Input> = { type: 'jwt' },
) => {
  // Bypass when user is already authenticated via JWT or token
  // Authentication overridden at router level e.g. external-router.ts
  if (req.user && authStrategy.type !== 'custom') return;

  try {
    if (authStrategy.type === 'authtoken') {
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
    } else if (authStrategy.type === 'custom') {
      req.user = await authStrategy.userResolver(rawInput, req.user as User);
    } else {
      await passport.authenticate(authStrategy.type, { session: false });
    }
    if (!req.user) throw new Error('Not authenticated');
  } catch (error) {
    throw new TRPCError({
      message: error instanceof Error ? error.message : (error as string),
      code: 'UNAUTHORIZED',
    });
  }
};

/**
 * tRPC procedure factory with authentication, traffic stats, and analytics middleware
 */
export const buildproc = <Input extends ZodSchema, Output extends ZodSchema>({
  method,
  name,
  md,
  tag,
  outMiddlewares,
  forceSecure,
}: BuildProcOptions<Input, Output>) => {
  const secure = forceSecure ?? isSecure(md);
  return trpc.procedure
    .use(async ({ ctx, rawInput, next }) => {
      if (secure) await authenticate(ctx.req, rawInput, md.authStrategy);
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
    .use(async ({ ctx, rawInput, next }) => {
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
      if (result.ok && outMiddlewares?.length) {
        for (const omw of outMiddlewares) {
          await omw(rawInput, result.data, ctx);
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
