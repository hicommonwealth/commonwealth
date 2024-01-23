import { ZodError, ZodSchema } from 'zod';
import { InvalidActor, InvalidInput } from './errors';
import { ActorMiddleware, CommandMetadata, type Actor } from './types';

/**
 * Actor middleware validation helper
 * @param actor signed-in user as actor
 * @param middleware chained actor middlewares
 * @returns validated actor
 */
const validate = async (
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

/**
 * Generic command handler
 * - Protocol adapters should use this handler to enter the model
 * @param md command metadata
 * @param id aggregate id
 * @param payload command payload
 * @param actor command actor
 * @returns command response
 */
export const command = async <M extends ZodSchema, R>(
  md: CommandMetadata<M, R>,
  id: string,
  payload: M,
  actor: Actor,
): Promise<R> => {
  try {
    return md.fn(
      id,
      md.schema.parse(payload),
      await validate(actor, md.middleware || []),
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const details = (error as ZodError).issues.map(
        ({ path, message }) => `${path.join('.')}: ${message}`,
      );
      throw new InvalidInput('Invalid command', details);
    }
    throw new InvalidInput('Invalid command', [error as string]);
  }
};
