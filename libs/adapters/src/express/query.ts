import type { QueryMetadata, User } from '@hicommonwealth/core';
import * as core from '@hicommonwealth/core';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodSchema, z } from 'zod';

/**
 * Adapts queries to express handlers
 * @param md query metadata
 * @returns express query handler
 */
export const query =
  <T, P extends ZodSchema>(md: QueryMetadata<T, P>): RequestHandler =>
  async (
    req: Request<
      Partial<z.infer<P>>,
      T,
      Partial<
        z.infer<P> & {
          address_id?: string;
        }
      >
    >,
    res: Response<T | undefined>,
    next: NextFunction,
  ) => {
    try {
      const results = await core.query(md, {
        actor: { user: req.user as User, address_id: req.body.address_id },
        payload: { ...req.body, ...req.params } as z.infer<P>,
      });
      return res.json(results);
    } catch (error) {
      next(error);
    }
  };
