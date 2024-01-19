import {
  command,
  type CommandMetadata,
  type UserAttributes,
} from '@hicommonwealth/model';
import type { Request, RequestHandler, Response } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Adapts commands to express handlers
 * - By convention, the aggregate id is a request parameter `:id`
 * - By convention, we can expect the following optional arguments in the body of the request: TODO: check this
 *  - address?: string;
 *  - author_chain?: string;
 *  - author_community_id?: string;
 *  - chain?: string;
 *  - chain_id?: string;
 *  - community_id?: string;
 * @param md command metadata
 * @returns express command handler
 */
export const expressCommand =
  <M extends ZodSchema, R>(md: CommandMetadata<M, R>): RequestHandler =>
  async (
    req: Request<
      { id: string },
      R,
      z.infer<M> & {
        address_id?: string;
        chain_id?: string;
        community_id?: string;
      }
    >,
    res: Response<R>,
  ) =>
    res.json(
      await command(md, req.params.id, req.body, {
        user: req.user as UserAttributes,
        address_id: req.body.address_id,
        community_id: req.body.chain_id ?? req.body.community_id,
      }),
    );
