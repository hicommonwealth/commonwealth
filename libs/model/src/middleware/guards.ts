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
 * @returns true if state is defined
 */
export const mustExist = <T>(subject: string, state?: T | null): state is T => {
  if (!state) throw new InvalidState(`${subject} must exist`, state);
  return true;
};

/**
 * Guards for non existing models. Throws InvalidState error when defined
 * @param subject state description
 * @param state state representing a model
 * @returns true if state is undefined
 */
export const mustNotExist = <T>(subject: string, state?: T | null) => {
  if (state) throw new InvalidState(`${subject} must not exist`, state);
};

/**
 * Used for error reporting if data is missing or corrupt in a query.
 * Won't throw errors if data is missing, but will at least log an error
 * so we are made aware of the issue.
 * @param subject state description
 * @param state state representing a model
 * @returns true if state is defined, false if undefined
 */
export const shouldExist = <T>(subject: string, state?: T | null) => {
  if (!state) {
    const err = new InvalidState(`${subject} should exist`, state);
    log.error(err.message, err);
    return false;
  }
  return true;
};

/**
 * Guards for super admin actors
 * @param actor current actor
 * @returns true if user is super admin
 */
export const mustBeSuperAdmin = (actor: Actor) => {
  if (!actor.user.isAdmin)
    throw new InvalidActor(actor, 'Must be super administrator');
  return true;
};
