import type { CommandMetadata, User } from '@hicommonwealth/core';
import * as core from '@hicommonwealth/core';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodSchema } from 'zod';

/**
 * Adapts commands to express handlers
 * - By convention, the aggregate id is a request parameter `:id`
 * - By convention, we can expect the following optional arguments in the body of the request:
 *  - address?: string;
 * @param md command metadata
 * @returns express command handler
 */
export const command =
  <Input extends core.CommandInput, Output extends ZodSchema>(
    md: CommandMetadata<Input, Output>,
  ): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { address, ...body } = req.body;
      const results = await core.command(md, {
        actor: { user: req.user as User, address },
        payload: { ...body, id: req.params.id ?? body.id },
      });
      return res.json(results);
    } catch (error) {
      next(error);
    }
  };
