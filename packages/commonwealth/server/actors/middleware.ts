import { Actor, ActorValidationError } from '.';

// TODO: normalize this (address, community_id, author_community_id)
export type CommandIds = {
  address?: string;
  author_chain?: string;
  author_community_id?: string;
  chain?: string;
  chain_id?: string;
  community_id?: string;
};

/**
 * Loads and validates actor state in a chain of responsibility pattern
 * @param actor the current actor state
 * @returns the updated actor state or error string
 */
export type ActorMiddleware = (
  actor: Actor,
  ids: CommandIds,
) => Promise<Actor | string>;

/**
 * Actor middleware handler
 * @param ids mapped ids from request arguments
 * @param middleware actor middlewares
 * @returns validated actor
 */
export const validate = async (
  ids: CommandIds,
  middleware: ActorMiddleware[],
): Promise<Actor> => {
  let actor: Actor = {};
  for (const fn of middleware) {
    const result = await fn(actor, ids);
    if (typeof result === 'string') throw new ActorValidationError(result);
    actor = result;
  }
  return actor;
};
