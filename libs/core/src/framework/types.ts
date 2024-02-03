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
 *   - `user`: authenticated user attributes
 * - Actors can "optionally" carry the following unique ids:
 *   - `address_id`: the active web wallet address
 *   - `aggregate_id`: the aggregate id when invoking a command
 * - Actors can also pre-load and validate state via chained {@link ActorMiddleware} reusable utilities
 *   - `aggregate`: the loaded aggregate when invoking a command
 *   - `author`: true when user is the author of the aggregate
 */
export type Actor<T> = {
  // must be signed in
  user: User;
  address_id?: string;
  aggregate_id?: string;
  aggregate?: T | null;
  author?: boolean;
};

/**
 * Middleware signature to loads and/or validates actor state in a chain of responsibility pattern
 * @param actor the current actor state
 * @returns the updated actor state, or throws invalid actor errors
 */
export type ActorMiddleware<T> = (actor: Actor<T>) => Promise<Actor<T>>;

/**
 * Command action signature
 * @param id aggregate id
 * @param payload command payload
 * @param actor command actor
 */
export type Command<T, M extends ZodSchema, R> = (
  id: string,
  payload: z.infer<M>,
  actor: Actor<T>,
) => Promise<R>;

/**
 * Query signature
 * @param payload query payload
 * @param actor command actor
 */
export type Query<M extends ZodSchema, R> = (
  payload: z.infer<M>,
  actor: Actor<never>,
) => Promise<R | undefined | null>;

/**
 * Command definition
 */
export type CommandMetadata<T, M extends ZodSchema, R> = {
  fn: Command<T, M, R>;
  schema: M;
  middleware?: ActorMiddleware<T>[];
};

/**
 * Query definition
 */
export type QueryMetadata<M extends ZodSchema, R> = {
  fn: Query<M, R>;
  schema: M;
  middleware?: ActorMiddleware<never>[];
};
