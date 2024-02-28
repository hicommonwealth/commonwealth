import { command, type CommandMetadata, type User } from '@hicommonwealth/core';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodSchema } from 'zod';

/**
 * Adapts commands to express handlers
 * - By convention, the aggregate id is a request parameter `:id`
 * - By convention, we can expect the following optional arguments in the body of the request:
 *  - address_id?: string;
 * @param md command metadata
 * @returns express command handler
 */
export const expressCommand =
  <T, P extends ZodSchema>(md: CommandMetadata<T, P>): RequestHandler =>
  async (
    req: Request<{ id: string }>,
    res: Response<Partial<T> | undefined>,
    next: NextFunction,
  ) => {
    try {
      const results = await command(md, {
        id: req.params.id,
        actor: { user: req.user as User, address_id: req.body.address_id },
        payload: req.body,
      });
      return res.json(results);
    } catch (error) {
      next(error);
    }
  };
