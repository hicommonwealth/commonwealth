import { query, type QueryMetadata, type User } from '@hicommonwealth/core';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
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
    next: NextFunction,
  ) => {
    try {
      const results = await query(md, {
        actor: { user: req.user as User },
        payload: { ...req.body, ...req.params } as z.infer<P>,
      });
      return res.json(results);
    } catch (error) {
      next(error);
    }
  };
