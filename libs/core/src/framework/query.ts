import { ZodError, ZodSchema } from 'zod';
import { INVALID_ACTOR_ERROR, InvalidInput } from './errors';
import { QueryMetadata, type Actor } from './types';
import { validateActor } from './utils';

/**
 * Generic query handler
 * - Protocol adapters should use this handler to enter the model
 * @param md query metadata
 * @param payload query payload
 * @param actor query actor
 * @returns query response
 */
export const query = async <M extends ZodSchema, R>(
  md: QueryMetadata<M, R>,
  payload: M,
  actor: Actor<never>,
): Promise<R | undefined | null> => {
  try {
    return md.fn(
      md.schema.parse(payload),
      await validateActor(actor, md.middleware || []),
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        const details = (error as ZodError).issues.map(
          ({ path, message }) => `${path.join('.')}: ${message}`,
        );
        throw new InvalidInput('Invalid query', details);
      } else if (error.name === INVALID_ACTOR_ERROR) throw error;
    }
    throw new InvalidInput('Invalid query', [error as string]);
  }
};
