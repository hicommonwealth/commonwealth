import type { Metadata, User } from '@hicommonwealth/core';
import * as core from '@hicommonwealth/core';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodType, z } from 'zod/v4';

/**
 * Adapts queries to express handlers
 * @param md query metadata
 * @returns express query handler
 */
export const query =
  <Input extends ZodType, Output extends ZodType, Context extends ZodType>(
    md: Metadata<Input, Output, Context>,
  ): RequestHandler =>
  async (req: Request, res: Response<z.infer<Output>>, next: NextFunction) => {
    try {
      const results = await core.query(md, {
        actor: { user: req.user as User, address: req.body.address },
        payload: { ...req.query, ...req.params } as z.infer<Input>,
      });
      return res.json(results);
    } catch (error) {
      next(error);
    }
  };
