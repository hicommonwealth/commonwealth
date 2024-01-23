import { z, ZodSchema } from 'zod';
import { UserAttributes } from './models';

/**
 * "Core" abstraction representing the "user acting on the system", either invoking a command on an aggregate, or querying a projection
 * - Common actors are identified by their unique `user.id` (jwt signin flow)
 *   - `user`: user profile attributes
 * - Actors can "optionally" carry the following unique ids:
 *   - `address_id`: the current web wallet address (TODO: is this optional?)
 *   - `aggregate_id`: the aggregate id when invoking a command
 * - Actors can also pre-load and validate state via chained {@link ActorMiddleware} reusable utilities
 *   - `author`: user is the author of the aggregate
 */
export type Actor = {
  // must be signed in
  user: UserAttributes;
  address_id?: string;
  aggregate_id?: string;
  author?: boolean;
};

/**
 * Command action signature
 * @param actor command actor
 * @param id aggregate id
 * @param payload command payload
 */
export type Command<M extends ZodSchema, R> = (
  id: string,
  payload: z.infer<M>,
  actor: Actor,
) => Promise<R>;

/**
 * Middleware signature to loads and/or validates actor state in a chain of responsibility pattern
 * @param actor the current actor state
 * @returns the updated actor state or error string
 * - TODO: should we use [error, actor] tuples instead of returning string?
 */
export type ActorMiddleware = (actor: Actor) => Promise<Actor | string>;

/**
 * Command definition
 */
export type CommandMetadata<M extends ZodSchema, R> = {
  schema: M;
  middleware?: ActorMiddleware[];
  fn: Command<M, R>;
};
