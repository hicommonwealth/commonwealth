import type {
  ActorMiddleware,
  Command,
  UserAttributes,
} from '@hicommonwealth/model';
import { InvalidInput, validate } from '@hicommonwealth/model';
import type { Request, RequestHandler, Response } from 'express';
import { ZodError, ZodSchema, z } from 'zod';

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
 * @param fn core command implementation
 * @param middleware actor middleware
 * @returns express command handler
 */
export const expressCommand =
  <M extends ZodSchema, R>(
    fn: Command<M, R>,
    schema: M,
    middleware: ActorMiddleware[],
  ): RequestHandler =>
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
  ) => {
    try {
      const payload = schema.parse(req.body);
      const actor = await validate(
        {
          user: req.user as UserAttributes,
          address_id: req.body.address_id,
          community_id: req.body.chain_id ?? req.body.community_id,
        },
        middleware,
      );
      return res.json(await fn(actor, req.params.id, payload));
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        const details = (error as ZodError).issues.map(
          ({ path, message }) => `${path.join('.')}: ${message}`,
        );
        throw new InvalidInput('Invalid command', details);
      }
      throw new InvalidInput('Invalid command', [error]);
    }
  };
