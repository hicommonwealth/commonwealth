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
  <Input extends ZodSchema, Output extends ZodSchema>(
    md: QueryMetadata<Input, Output>,
  ): RequestHandler =>
  async (
    req: Request,
    res: Response<z.infer<Output> | undefined>,
    next: NextFunction,
  ) => {
    try {
      const results = await core.query(md, {
        actor: { user: req.user as User, address_id: req.body.address_id },
        payload: { ...req.query, ...req.params } as z.infer<Input>,
      });
      return res.json(results);
    } catch (error) {
      next(error);
    }
  };
