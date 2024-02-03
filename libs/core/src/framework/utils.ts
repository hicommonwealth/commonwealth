import { Actor, ActorMiddleware } from './types';

/**
 * Actor middleware validation helper
 * @param actor signed-in user as actor
 * @param middleware chained actor middlewares
 * @returns validated actor
 */
export const validateActor = async <T>(
  actor: Actor<T>,
  middleware: ActorMiddleware<T>[],
): Promise<Actor<T>> => {
  for (const fn of middleware) {
    actor = await fn(actor);
  }
  return actor;
};
