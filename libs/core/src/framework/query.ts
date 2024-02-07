import z, { ZodError, ZodSchema } from 'zod';
import { InvalidInput, QueryContext, QueryMetadata, type Actor } from './types';

/**
 * Generic query handler that adapts external protocols to conventional query flow
 * - Protocol adapters should use this handler to enter the model
 * @param md query metadata
 * @param payload query payload (filters)
 * @param actor query actor
 * @returns query results
 * @throws {@link InvalidInput} when user invokes query with invalid payload or attributes, or rethrows internal errors
 */
export const query = async <T, P extends ZodSchema>(
  { schema, auth, body }: QueryMetadata<T, P>,
  payload: z.infer<P>,
  actor: Actor,
): Promise<T | undefined> => {
  try {
    const context: QueryContext<P> = { actor, payload: schema.parse(payload) };
    for (const fn of auth) {
      await fn(context);
    }
    return await body(context);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        const details = (error as ZodError).issues.map(
          ({ path, message }) => `${path.join('.')}: ${message}`,
        );
        throw new InvalidInput('Invalid query payload', details);
      }
      throw error;
    }
    throw new InvalidInput('Invalid query', [error as string]);
  }
};
