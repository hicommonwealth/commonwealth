import { z, ZodError, ZodSchema } from 'zod';
import { InvalidInput, type Context, type Metadata } from './types';

/**
 * Generic query handler that adapts external protocols to conventional query flow
 * - Protocol adapters should use this handler to enter the model
 * @param md query metadata
 * @param payload query payload (filters)
 * @param actor query actor
 * @param validate true to validate payload
 * @returns query results
 * @throws {@link InvalidInput} when user invokes query with invalid payload or attributes, or rethrows internal errors
 */
export const query = async <
  Input extends ZodSchema,
  Output extends ZodSchema,
  AuthContext,
>(
  { input, auth, body }: Metadata<Input, Output, AuthContext>,
  { actor, payload }: Context<Input, AuthContext>,
  validate = true,
): Promise<z.infer<Output> | undefined> => {
  try {
    const context: Context<Input, AuthContext> = {
      actor,
      payload: validate
        ? Object.fromEntries(
            Object.entries(input.parse(payload)).filter(
              ([, v]) => v !== undefined,
            ),
          )
        : payload,
    };
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
    throw new InvalidInput('Invalid query', [
      typeof error !== 'string' ? JSON.stringify(error) : error,
    ]);
  }
};
