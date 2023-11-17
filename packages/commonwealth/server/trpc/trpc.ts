import { inferAsyncReturnType, initTRPC, TRPCError } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/dist/adapters/express';
import passport from 'passport';
import { OpenApiMeta } from 'trpc-openapi';
import models from '../database';
import { UserAttributes } from '../models/user';

async function decodeJwtToken(req): Promise<UserAttributes | null> {
  return new Promise<UserAttributes | null>((resolve) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
      if (err || !user) {
        return resolve(null);
      }
      resolve(user);
    })(req);
  });
}

export async function createContext({ req }: CreateExpressContextOptions) {
  const user = await decodeJwtToken(req);
  return {
    user,
    models,
  };
}

type Context = inferAsyncReturnType<typeof createContext>;

const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next();
});

export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
export const mergeRouters = t.mergeRouters;
