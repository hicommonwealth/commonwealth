import { query, type QueryMetadata, type User } from '@hicommonwealth/core';
import type { Request, RequestHandler, Response } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Adapts queries to express handlers
 * @param md query metadata
 * @returns express query handler
 */
export const expressQuery =
  <M extends ZodSchema, R>(md: QueryMetadata<M, R>): RequestHandler =>
  async (
    req: Request<Partial<z.infer<M>>, R, Partial<z.infer<M>>>,
    res: Response<R>,
  ) =>
    res.json(
      await query(md, { ...req.body, ...req.params } as z.infer<M>, {
        user: req.user as User,
      }),
    );
