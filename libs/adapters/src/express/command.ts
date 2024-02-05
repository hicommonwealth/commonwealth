import { command, type CommandMetadata, type User } from '@hicommonwealth/core';
import type { Request, RequestHandler, Response } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Adapts commands to express handlers
 * - By convention, the aggregate id is a request parameter `:id`
 * - By convention, we can expect the following optional arguments in the body of the request: TODO: check this
 *  - address_id?: string;
 * @param md command metadata
 * @returns express command handler
 */
export const expressCommand =
  <T, P extends ZodSchema>(md: CommandMetadata<T, P>): RequestHandler =>
  async (
    req: Request<
      { id: string },
      T,
      z.infer<P> & {
        address_id?: string;
      }
    >,
    res: Response<Partial<T> | undefined | null>,
  ) => {
    const context = await command(md, req.params.id, req.body, {
      user: req.user as User,
      address_id: req.body.address_id,
    });
    return res.json(context.state);
  };
