import { type AuthStrategies, type User } from '@hicommonwealth/core';
import { TRPCError, initTRPC } from '@trpc/server';
import type { Request } from 'express';
import passport from 'passport';
import type { OpenApiMeta } from 'trpc-swagger';
import { ZodType, z } from 'zod/v4';
import { config } from '../config';
import type { BuildProcOptions, Context, Metadata } from './types';

const trpc = initTRPC.meta<OpenApiMeta>().context<Context>().create();
export const router = trpc.router;
export const procedure = trpc.procedure;

const isSecure = <Input extends ZodType, Output extends ZodType>(
  md: Metadata<Input, Output>,
  forceSecure?: boolean,
) => {
  const firstAuth = md.auth?.at(0);
  const optional =
    typeof firstAuth === 'function' &&
    firstAuth.name.startsWith('authOptional');
  return {
    secure: forceSecure || md.secure !== false || !!firstAuth,
    optional,
  };
};

const authenticate = async <Input extends ZodType>(
  req: Request,
  rawInput: z.infer<Input>,
  authStrategy: AuthStrategies<Input> = { type: 'jwt' },
  optional: boolean,
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
    if (!req.user && !optional) throw new Error('Not authenticated');
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
export const buildproc = <Input extends ZodType, Output extends ZodType>({
  method,
  name,
  md,
  tag,
  outMiddlewares,
  forceSecure,
}: BuildProcOptions<Input, Output>) => {
  const { secure, optional } = isSecure(md, forceSecure);
  return trpc.procedure
    .use(async ({ ctx, next, getRawInput }) => {
      if (secure) {
        const input = (await getRawInput()) as z.infer<Input>;
        await authenticate(ctx.req, input, md.authStrategy, optional);
      }
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
    .use(async ({ ctx, next, getRawInput }) => {
      const result = await next();
      if (result.ok && outMiddlewares?.length) {
        const input = (await getRawInput()) as z.infer<Input>;
        for (const omw of outMiddlewares) {
          await omw(input, result.data as z.infer<Output>, ctx);
        }
      }
      return result;
    })
    .meta({
      openapi: {
        method,
        description: md.input.description, // zod property description
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
