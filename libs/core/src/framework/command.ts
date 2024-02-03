import { ZodError, ZodSchema } from 'zod';
import { INVALID_ACTOR_ERROR, InvalidInput } from './errors';
import { CommandMetadata, type Actor } from './types';
import { validateActor } from './utils';

/**
 * Generic command handler
 * - Protocol adapters should use this handler to enter the model
 * @param md command metadata
 * @param id aggregate id
 * @param payload command payload
 * @param actor command actor
 * @returns command response
 */
export const command = async <T, M extends ZodSchema, R>(
  md: CommandMetadata<T, M, R>,
  id: string,
  payload: M,
  actor: Actor<T>,
): Promise<R> => {
  try {
    return md.fn(
      id,
      md.schema.parse(payload),
      await validateActor(actor, md.middleware || []),
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        const details = (error as ZodError).issues.map(
          ({ path, message }) => `${path.join('.')}: ${message}`,
        );
        throw new InvalidInput('Invalid command', details);
      } else if (error.name === INVALID_ACTOR_ERROR) throw error;
    }
    throw new InvalidInput('Invalid command', [error as string]);
  }
};
