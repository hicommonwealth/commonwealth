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
 * Command signature
 * @param actor the command actor
 * @param id the aggregate id
 * @param payload the command payload
 */
export type Command<M extends ZodSchema, R> = (
  actor: Actor,
  id: string,
  payload: z.infer<M>,
) => Promise<R>;
