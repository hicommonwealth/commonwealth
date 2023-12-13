import { Actor, ActorValidationError } from '.';

/**
 * Loads and validates actor state in a chain of responsibility pattern
 * @param actor the current actor state
 * @returns the updated actor state or error string
 */
export type ActorMiddleware = (actor: Actor) => Promise<Actor | string>;

/**
 * Actor middleware handler
 * @param middleware actor middlewares
 * @returns validated actor
 */
export const validate = async (
  middleware: ActorMiddleware[],
): Promise<Actor> => {
  let actor: Actor = {};
  for (const fn of middleware) {
    const result = await fn(actor);
    if (typeof result === 'string') throw new ActorValidationError(result);
    actor = result;
  }
  return actor;
};
