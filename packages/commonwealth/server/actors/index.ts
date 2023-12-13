import { AddressAttributes } from '../models/address';
import { CommunityAttributes } from '../models/community';
import { Role } from '../models/role';
import { UserAttributes } from '../models/user';

/**
 * Holds relevant information about the actor invoking a command
 * - Loaded and validated by chained {@link ActorMiddleware} utilities
 */
export type Actor = {
  user?: UserAttributes; // user profile
  address?: AddressAttributes; // actor address
  community?: CommunityAttributes; // acting on community
  role?: Role; // actor role
  author?: boolean; // address is author of community
};

/**
 * Actor validation error name
 */
export const ACTOR_VALIDATION_ERROR = 'ActorValidationError';
/**
 * Actor validation error
 */
export class ActorValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = ACTOR_VALIDATION_ERROR;
  }
}
