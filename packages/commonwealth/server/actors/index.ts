import type { AddressAttributes } from '../models/address';
import type { CommunityAttributes } from '../models/community';
import type { UserAttributes } from '../models/user';

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

export const ACTOR_VALIDATION_ERROR = 'ActorValidationError';
/**
 * Custom actor validation error
 * - Used by specific protocol adapters to build error responses (with codes, etc)
 */
export class ActorValidationError extends Error {
  constructor(public actor: Actor, message: string) {
    super(message);
    this.name = ACTOR_VALIDATION_ERROR;
  }
}
