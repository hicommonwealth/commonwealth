import { z } from 'zod';

export const paginationSchema = {
  limit: z.coerce
    .number()
    .int()
    .default(20)
    .describe('The number of objects returned'),
  offset: z.coerce
    .number()
    .int()
    .default(0)
    .describe('The amount of objects offset from the beginning'),
};
