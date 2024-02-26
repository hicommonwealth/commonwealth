import type { CommandMetadata, QueryMetadata } from '@hicommonwealth/core';
import * as core from '@hicommonwealth/core';
import {
  TRPCError,
  initTRPC,
  type MiddlewareBuilder,
  type ProcedureParams,
} from '@trpc/server';
import {
  CreateExpressContextOptions,
  createExpressMiddleware,
} from '@trpc/server/adapters/express';
import passport from 'passport';
//import superjson from 'superjson';
import { Request } from 'express';
import { renderTrpcPanel } from 'trpc-panel';
import { AnyZodObject, z } from 'zod';

interface Context {
  req: Request;
}

const trpc = initTRPC.context<Context>().create({
  //transformer: superjson,
});

export const router = trpc.router;

export const authenticate = trpc.middleware(async ({ ctx, next }) => {
  try {
    await passport.authenticate('jwt', { session: false });
    if (!ctx.req.user) throw new Error('Not authenticated');
    return next();
  } catch (error) {
    throw new TRPCError({ message: error.message, code: 'UNAUTHORIZED' });
  }
});

export const command = <T, P extends AnyZodObject>(
  md: CommandMetadata<T, P>,
  middleware?: MiddlewareBuilder<ProcedureParams, ProcedureParams>,
) =>
  (middleware ? trpc.procedure.use(middleware) : trpc.procedure)
    .input(
      z
        .object({
          id: z.string().optional(),
          address_id: z.string().optional(),
        })
        .merge(md.schema),
    )
    //.output(z.object({})); // TODO
    .mutation(async ({ ctx, input }) => {
      return await core.command(
        md,
        {
          id: ctx.req.params.id || input.id,
          actor: {
            user: ctx.req.user as core.User,
            address_id:
              ctx.req.body.address_id ||
              ctx.req.query.address_id ||
              input.address_id,
          },
          payload: input,
        },
        false,
      );
    });

export const query = <T, P extends AnyZodObject>(
  md: QueryMetadata<T, P>,
  middleware?: MiddlewareBuilder<ProcedureParams, ProcedureParams>,
) =>
  (middleware ? trpc.procedure.use(middleware) : trpc.procedure)
    .input(z.object({ address_id: z.string().optional() }).merge(md.schema))
    //.output(z.object({})); // TODO
    .query(async ({ ctx, input }) => {
      return await core.query(
        md,
        {
          actor: {
            user: ctx.req.user as core.User,
            address_id:
              (ctx.req.query.address_id as string) || input.address_id,
          },
          payload: input,
        },
        false,
      );
    });

export const toExpress = (router) =>
  createExpressMiddleware({
    router,
    createContext: ({ req }: CreateExpressContextOptions) => ({ req }),
  });

export const toPanel = (router, url) => renderTrpcPanel(router, { url }); //, transformer: 'superjson' });
