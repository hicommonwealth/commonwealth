import { z, ZodSchema } from 'zod';
import {
  AddressAttributes,
  CommunityAttributes,
  UserAttributes,
} from './models';

/**
 * "Core" abstraction representing the "user acting on a system", either invoking a command or query operation
 * - Common actors are identified by their unique `user.id` (jwt signin flow)
 *   - `user`: user profile attributes
 * - Actors can "optionally" carry the following unique ids:
 *   - `address_id`: the current web wallet address (TODO: is this optional?)
 *   - `community_id`: when acting on a community
 * - Actors can also pre-load and validate entities via chained {@link ActorMiddleware} reusable utilities
 *   - `address`: current address attributes
 *   - `community`: current community attributes
 *   - `author`: user is the community author
 */
export type Actor = {
  // must be signed in
  user: UserAttributes;
  // other ids
  address_id?: string;
  community_id?: string;
  // entities
  address?: AddressAttributes;
  community?: CommunityAttributes;
  // flags
  author?: boolean;
};

/**
 * Command action signature
 * @param actor command actor
 * @param id aggregate id
 * @param payload command payload
 */
export type Command<M extends ZodSchema, R> = (
  actor: Actor,
  id: string,
  payload: z.infer<M>,
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
  fn: Command<M, R>;
  schema: M;
  middleware?: ActorMiddleware[];
};
