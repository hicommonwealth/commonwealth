import { InvalidActor } from '../errors';
import { type Actor } from '../types';

/**
 * Middleware signature to loads and/or validates actor state in a chain of responsibility pattern
 * @param actor the current actor state
 * @returns the updated actor state or error string
 * - TODO: should we use [error, actor] tuples instead of returning string?
 */
export type ActorMiddleware = (actor: Actor) => Promise<Actor | string>;

/**
 * Actor middleware validation
 * @param actor signed-in user as actor
 * @param middleware chained actor middlewares
 * @returns validated actor
 */
export const validate = async (
  actor: Actor,
  middleware: ActorMiddleware[],
): Promise<Actor> => {
  for (const fn of middleware) {
    const result = await fn(actor);
    if (typeof result === 'string') throw new InvalidActor(actor, result);
    actor = result;
  }
  return actor;
};
