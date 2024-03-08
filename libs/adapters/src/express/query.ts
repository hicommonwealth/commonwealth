import type { QueryMetadata, Schemas, User } from '@hicommonwealth/core';
import * as core from '@hicommonwealth/core';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z } from 'zod';

/**
 * Adapts queries to express handlers
 * @param md query metadata
 * @returns express query handler
 */
export const query =
  <S extends Schemas>(md: QueryMetadata<S>): RequestHandler =>
  async (
    req: Request,
    res: Response<z.infer<S['output']> | undefined>,
    next: NextFunction,
  ) => {
    try {
      const results = await core.query(md, {
        actor: { user: req.user as User, address_id: req.body.address_id },
        payload: { ...req.query, ...req.params } as z.infer<S['input']>,
      });
      return res.json(results);
    } catch (error) {
      next(error);
    }
  };
