import type { CommandMetadata, User } from '@hicommonwealth/core';
import * as core from '@hicommonwealth/core';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodSchema, z } from 'zod';

/**
 * Adapts commands to express handlers
 * - By convention, the aggregate id is a request parameter `:id`
 * - By convention, we can expect the following optional arguments in the body of the request:
 *  - address_id?: string;
 * @param md command metadata
 * @returns express command handler
 */
export const command =
  <Input extends ZodSchema, Output extends ZodSchema>(
    md: CommandMetadata<Input, Output>,
  ): RequestHandler =>
  async (
    req: Request<
      z.infer<Input> & {
        id?: string;
        address_id?: string;
      }
    >,
    res: Response<Partial<z.infer<Output>> | undefined>,
    next: NextFunction,
  ) => {
    try {
      const results = await core.command(md, {
        id: req.params.id,
        actor: { user: req.user as User, address_id: req.body.address_id },
        payload: req.body,
      });
      return res.json(results);
    } catch (error) {
      next(error);
    }
  };
