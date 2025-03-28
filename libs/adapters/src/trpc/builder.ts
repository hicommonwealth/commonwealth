import { type AuthStrategies, type User } from '@hicommonwealth/core';
import { TRPCError, initTRPC } from '@trpc/server';
import type { Request } from 'express';
import passport from 'passport';
import type { OpenApiMeta } from 'trpc-swagger';
import { ZodSchema } from 'zod';
import { config } from '../config';
import type { BuildProcOptions, Context, Metadata } from './types';

const trpc = initTRPC.meta<OpenApiMeta>().context<Context>().create();
export const router = trpc.router;
export const procedure = trpc.procedure;

const isSecure = <Input extends ZodSchema, Output extends ZodSchema>(
  md: Metadata<Input, Output>,
) => md.secure !== false || (md.auth ?? []).length > 0;

const authenticate = async <Input extends ZodSchema>(
  req: Request,
  rawInput: Input extends ZodSchema<infer T> ? T : any,
  authStrategy: AuthStrategies<Input> = { type: 'jwt' },
) => {
  console.log('TRPC1: authenticate started', authStrategy.type);

  // Bypass when user is already authenticated via JWT or token
  // Authentication overridden at router level e.g. external-router.ts
  if (req.user && authStrategy.type !== 'custom') return;

  try {
    if (authStrategy.type === 'authtoken') {
      console.log(
        'TRPC2: authenticating with authtoken',
        req.headers['authorization'],
      );
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
          console.log('TRPC3: Invalid authorization token');
          throw new Error('Not authenticated');
      }
    } else if (authStrategy.type === 'custom') {
      console.log('TRPC4: authenticating with custom strategy');
      req.user = await authStrategy.userResolver(rawInput, req.user as User);
    } else {
      console.log('TRPC5: authenticating with passport', authStrategy.type);
      await passport.authenticate(authStrategy.type, { session: false });
    }
    console.log('TRPC6: authentication successful, user ID:', req.user?.id);
    if (!req.user) throw new Error('Not authenticated');
  } catch (error) {
    console.log('TRPC7: authentication error', error);
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
      const result = await next();
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
