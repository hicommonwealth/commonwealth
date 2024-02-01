import { ZodSchema, z } from 'zod';

/**
 * Authenticated user
 */
export type User = {
  email: string;
  id?: number;
  emailVerified?: boolean;
  isAdmin?: boolean;
};

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
  user: User;
  address_id?: string;
  aggregate_id?: string;
  author?: boolean;
};

/**
 * Middleware signature to loads and/or validates actor state in a chain of responsibility pattern
 * @param actor the current actor state
 * @returns the updated actor state or error string
 * - TODO: should we use [error, actor] tuples instead of returning string?
 */
export type ActorMiddleware = (actor: Actor) => Promise<Actor | string>;

/**
 * Command action signature
 * @param id aggregate id
 * @param payload command payload
 * @param actor command actor
 */
export type Command<M extends ZodSchema, R> = (
  id: string,
  payload: z.infer<M>,
  actor: Actor,
) => Promise<R>;

/**
 * Query signature
 * @param payload query payload
 * @param actor command actor
 */
export type Query<M extends ZodSchema, R> = (
  payload: z.infer<M>,
  actor: Actor,
) => Promise<R>;

/**
 * Command definition
 */
export type CommandMetadata<M extends ZodSchema, R> = {
  fn: Command<M, R>;
  schema: M;
  middleware?: ActorMiddleware[];
};

/**
 * Query definition
 */
export type QueryMetadata<M extends ZodSchema, R> = {
  fn: Query<M, R>;
  schema: M;
  middleware?: ActorMiddleware[];
};
