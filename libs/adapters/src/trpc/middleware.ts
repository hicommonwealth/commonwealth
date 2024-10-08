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
  Comment = 'Comment',
  Reaction = 'Reaction',
  Integration = 'Integration',
  Subscription = 'Subscription',
  LoadTest = 'LoadTest',
  Wallet = 'Wallet',
  Webhook = 'Webhook',
  SuperAdmin = 'SuperAdmin',
  DiscordBot = 'DiscordBot',
}

export type Commit<Input extends ZodSchema, Output extends ZodSchema> = (
  input: z.infer<Input>,
  output: z.infer<Output>,
  ctx: Context,
) => Promise<[string, Record<string, unknown>] | undefined | void>;

/**
 * Supports two options to track analytics
 * 1. A declarative tuple with [event name, optional output mapper]
 * 2. A "general" async mapper that derives the tuple of [event name, data] from input/output
 */
export type Track<Input extends ZodSchema, Output extends ZodSchema> =
  | [string, mapper?: (output: z.infer<Output>) => Record<string, unknown>]
  | ((
      input: z.infer<Input>,
      output: z.infer<Output>,
    ) => Promise<[string, Record<string, unknown>] | undefined>);

async function evalTrack<Input extends ZodSchema, Output extends ZodSchema>(
  track: Track<Input, Output>,
  input: z.infer<Input>,
  output: z.infer<Output>,
) {
  if (typeof track === 'function') {
    const tuple = await track(input, output);
    return tuple
      ? { event: tuple[0], data: tuple[1] }
      : { event: undefined, data: undefined };
  }
  return {
    event: track[0],
    data: track[1] ? track[1](output) : {},
  };
}

/**
 * Returns a record containing condensed browser info.
 * Expects the 'express-useragent' middleware to be applied to the route.
 * Includes 'is...' boolean entries if the value is true, and all string values
 */
function getRequestBrowserInfo(
  req: Request & { useragent?: Record<string, unknown> },
) {
  const info: Record<string, unknown> = req.useragent
    ? Object.entries(req.useragent)
        .filter(([k, v]) => typeof v === 'string' || (k.startsWith('is') && v))
        .reduce((p, [k, v]) => Object.assign(p, { [k]: v }), {})
    : {};
  const brand = req.headers['sec-ch-ua'];
  if (typeof brand === 'string' && brand.includes('Brave')) {
    delete info['isChrome'];
    info['isBrave'] = true;
    info['browser'] = 'Brave';
  }
  return info;
}

async function trackAnalytics<
  Input extends ZodSchema,
  Output extends ZodSchema,
>(
  track: Track<Input, Output>,
  ctx: Context,
  input: z.infer<Input>,
  output: z.infer<Output>,
) {
  try {
    const host = ctx.req.headers.host;
    const { event, data } = await evalTrack(track, input, output);
    if (event) {
      const payload = {
        ...data,
        ...getRequestBrowserInfo(ctx.req),
        ...(host && { isCustomDomain: config.SERVER_URL.includes(host) }),
        userId: ctx.actor.user.id,
        isPWA: ctx.req.headers?.['isPWA'] === 'true',
      };
      analytics().track(event, payload);
    }
  } catch (err) {
    err instanceof Error && log.error(err.message, err);
  }
}

export type BuildProcOptions<
  Input extends ZodSchema,
  Output extends ZodSchema,
> = {
  method: 'GET' | 'POST';
  name: string;
  md: Metadata<Input, Output>;
  tag: Tag;
  track?: Track<Input, Output>;
  commit?: Commit<Input, Output>;
  forceSecure?: boolean;
};

/**
 * tRPC procedure factory with authentication, traffic stats, and analytics middleware
 */
export const buildproc = <Input extends ZodSchema, Output extends ZodSchema>({
  method,
  name,
  md,
  tag,
  track,
  commit,
  forceSecure,
}: BuildProcOptions<Input, Output>) => {
  const secure = forceSecure ?? isSecure(md);
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
      track &&
        result.ok &&
        void trackAnalytics(track, ctx, rawInput, result.data).catch(log.error);
      commit &&
        result.ok &&
        void commit(rawInput, result.data, ctx).catch(log.error);
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
  // User is already authenticated. Authentication overridden at router level e.g. external-router.ts
  if (req.user) return;

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
