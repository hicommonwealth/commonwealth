import type {
  Actor,
  CommandMetadata,
  QueryMetadata,
} from '@hicommonwealth/core';
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
import { renderTrpcPanel } from 'trpc-panel';
import { ZodSchema } from 'zod';

interface Context {
  id?: string;
  actor: Actor;
}

const trpc = initTRPC.context<Context>().create({
  //transformer: superjson,
});

export const router = trpc.router;

export const authenticate = trpc.middleware(async ({ ctx, next }) => {
  try {
    const { user } = await passport.authenticate('jwt', { session: false });
    if (!user) throw new Error('Not authenticated');
    return next({ ctx: { id: ctx.id, user } });
  } catch (error) {
    throw new TRPCError({ message: error.message, code: 'UNAUTHORIZED' });
  }
});

export const command = <T, P extends ZodSchema>(
  md: CommandMetadata<T, P>,
  middleware?: MiddlewareBuilder<ProcedureParams, ProcedureParams>,
) =>
  (middleware ? trpc.procedure.use(middleware) : trpc.procedure)
    .input(md.schema)
    //.output(z.object({})); // TODO
    .mutation(async ({ ctx, input }) => {
      return await core.command(
        md,
        {
          id: ctx.id,
          actor: ctx.actor,
          payload: input,
        },
        false,
      );
    });

export const query = <T, P extends ZodSchema>(
  md: QueryMetadata<T, P>,
  middleware?: MiddlewareBuilder<ProcedureParams, ProcedureParams>,
) =>
  (middleware ? trpc.procedure.use(middleware) : trpc.procedure)
    .input(md.schema)
    //.output(z.object({})); // TODO
    .query(async ({ ctx, input }) => {
      return await core.query(
        md,
        {
          actor: ctx.actor,
          payload: input,
        },
        false,
      );
    });

export const toExpress = (router) =>
  createExpressMiddleware({
    router,
    createContext: ({ req }: CreateExpressContextOptions) => ({
      id: req.params.id,
    }),
  });

export const toPanel = (router, url) =>
  renderTrpcPanel(router, { url, transformer: 'superjson' });
