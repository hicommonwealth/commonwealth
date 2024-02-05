import z, { ZodError, ZodSchema } from 'zod';
import { InvalidInput, QueryContext, QueryMetadata, type Actor } from './types';

/**
 * Generic query handler that adapts external protocols to conventional query flow
 * - Protocol adapters should use this handler to enter the model
 * @param md query metadata
 * @param payload query payload (filters)
 * @param actor query actor
 * @returns resolved query context
 */
export const query = async <T, P extends ZodSchema>(
  { schema, auth, body }: QueryMetadata<T, P>,
  payload: z.infer<P>,
  actor: Actor,
): Promise<QueryContext<T, P>> => {
  try {
    let context: QueryContext<T, P> = { actor, payload: schema.parse(payload) };
    for (const fn of auth) {
      context = await fn(context);
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
