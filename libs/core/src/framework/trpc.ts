import { TRPCError, initTRPC } from '@trpc/server';
import { ZodSchema, z } from 'zod';
import { User, command, type CommandMetadata } from '.';

interface Context {
  user?: User;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;

export const authenticated = t.procedure.use(async (opts) => {
  const { ctx } = opts;
  if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });
  return opts.next({
    ctx: {
      user: ctx.user,
    },
  });
});

export const trpcCommand = <T, P extends ZodSchema>(
  md: CommandMetadata<T, P>,
) =>
  t.procedure
    .input(
      z.object({
        id: z.string().optional(),
        address_id: z.string().optional(),
        payload: md.schema,
      }),
    )
    .mutation(async (opts) => {
      return await command(md, {
        id: opts.input?.id,
        actor: { user: opts.ctx.user! },
        payload: opts.input?.payload,
      });
    });
