import { z } from 'zod';
import { publicProcedure, router } from '../trpc';

export const todoRouter = router({
  todo: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/root.todo' } })
    .input(z.void()) // no input expected
    .output(z.object({ greeting: z.string() }))
    .query(({ ctx }) => {
      return { greeting: `Hello World!` };
    }),
});

export const todoRootRouter = router({
  root: todoRouter,
});
