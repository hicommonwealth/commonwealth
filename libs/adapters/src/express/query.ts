import { query, type QueryMetadata, type User } from '@hicommonwealth/core';
import type { Request, RequestHandler, Response } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Adapts queries to express handlers
 * @param md query metadata
 * @returns express query handler
 */
export const expressQuery =
  <T, P extends ZodSchema>(md: QueryMetadata<T, P>): RequestHandler =>
  async (
    req: Request<Partial<z.infer<P>>, T, Partial<z.infer<P>>>,
    res: Response<T | undefined>,
  ) => {
    const results = await query(
      md,
      { ...req.body, ...req.params } as z.infer<P>,
      {
        user: req.user as User,
      },
    );
    return res.json(results);
  };
