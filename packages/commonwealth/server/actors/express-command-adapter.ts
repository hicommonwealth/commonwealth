import type {
  Request,
  RequestHandler,
  Response,
} from 'express-serve-static-core';
import type { Actor } from '.';
import { validate, type ActorMiddleware } from './middleware';

/**
 * Command signature
 * @param actor the command actor
 * @param id the aggregate id
 * @param payload the command payload
 */
export type Command<
  M extends Record<string, any>,
  R extends Record<string, any>,
> = (actor: Actor, id: string, payload: M) => Promise<R>;

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
export const command =
  <M, R>(fn: Command<M, R>, middleware: ActorMiddleware[]): RequestHandler =>
  async (
    req: Request<
      { id: string },
      R,
      M & { address_id?: string; chain_id?: string; community_id?: string }
    >,
    res: Response<R>,
  ) => {
    const actor = await validate(
      {
        user: req.user,
        address_id: req.body.address_id,
        community_id: req.body.chain_id ?? req.body.community_id,
      },
      middleware,
    );
    return res.json(await fn(actor, req.params.id, req.body));
  };
