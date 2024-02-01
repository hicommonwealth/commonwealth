import { InvalidActor } from './errors';
import { Actor, ActorMiddleware } from './types';

/**
 * Actor middleware validation helper
 * @param actor signed-in user as actor
 * @param middleware chained actor middlewares
 * @returns validated actor
 */
export const validateActor = async (
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
