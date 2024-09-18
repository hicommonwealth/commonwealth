import {
  InvalidActor,
  InvalidState,
  logger,
  type Actor,
} from '@hicommonwealth/core';
import type { AddressInstance, ThreadInstance } from '../models';
import type { AuthContext } from './authorization';

const log = logger(import.meta);

/**
 * Guards for existing models. Throws InvalidState error when undefined
 * @param subject state description
 * @param state state representing a model
 */
export function mustExist<T>(
  subject: string,
  state?: T | null,
): asserts state is NonNullable<T> {
  if (!state) throw new InvalidState(`${subject} must exist`, state);
}

/**
 * Guards for non existing models. Throws InvalidState error when defined
 * @param subject state description
 * @param state state representing a model
 */
export function mustNotExist<T>(
  subject: string,
  state?: T | null,
): asserts state is null | undefined {
  if (state) throw new InvalidState(`${subject} must not exist`, state);
}

/**
 * Used for error reporting if data is missing or corrupt in a query.
 * Won't throw errors if data is missing, but will at least log an error
 * so we are made aware of the issue.
 * @param subject state description
 * @param state state representing a model
 * @returns true if state is defined, false if undefined
 */
export function shouldExist<T>(subject: string, state?: T | null) {
  if (!state) {
    const err = new InvalidState(`${subject} should exist`, state);
    log.error(err.message, err);
    return false;
  }
  return true;
}

/**
 * Guards for super admin actors
 * @param actor current actor
 */
export function mustBeSuperAdmin(actor: Actor) {
  if (!actor.user.isAdmin)
    throw new InvalidActor(actor, 'Must be super administrator');
}

/**
 * Address authorization guard
 * @param auth auth context
 * @returns narrowed auth context
 */
export function mustBeAuthorized(actor: Actor, auth?: AuthContext) {
  if (!auth?.address) throw new InvalidActor(actor, 'Not authorized');
  return auth as AuthContext & {
    address: AddressInstance;
    community_id: string;
  };
}

/**
 * Thread authorization guard
 * @param auth auth context
 * @returns narrowed auth context
 */
export function mustBeAuthorizedThread(actor: Actor, auth?: AuthContext) {
  if (!auth?.address) throw new InvalidActor(actor, 'Not authorized');
  if (!auth?.thread) throw new InvalidActor(actor, 'Not authorized thread');
  return auth as AuthContext & {
    address: AddressInstance;
    thread: ThreadInstance;
    community_id: string;
    topic_id: number;
    thread_id: number;
  };
}

/**
 * Comment authorization guard
 * @param auth auth context
 * @returns narrowed auth context
 */
export function mustBeAuthorizedComment(actor: Actor, auth?: AuthContext) {
  if (!auth?.address) throw new InvalidActor(actor, 'Not authorized');
  if (!auth?.comment) throw new InvalidActor(actor, 'Not authorized comment');
  return auth as AuthContext & {
    address: AddressInstance;
    comment: ThreadInstance;
    community_id: string;
    topic_id: number;
    thread_id: number;
    comment_id: number;
  };
}
