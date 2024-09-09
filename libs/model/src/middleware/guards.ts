import {
  Actor,
  InvalidActor,
  InvalidState,
  logger,
} from '@hicommonwealth/core';

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
