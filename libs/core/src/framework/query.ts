import { z, ZodError, ZodType } from 'zod';
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
  Input extends ZodType,
  Output extends ZodType,
  _Context extends ZodType,
>(
  { input, auth, body }: Metadata<Input, Output, _Context>,
  { actor, payload }: Context<Input, _Context>,
  validate = true,
): Promise<z.infer<Output>> => {
  try {
    const validated = validate ? input.parse(payload) : payload;
    const stripped = (
      typeof validated === 'object'
        ? Object.fromEntries(
            Object.entries(validated).filter(([, v]) => v !== undefined),
          )
        : payload
    ) as z.infer<Input>;
    const context: Context<Input, _Context> = {
      actor,
      payload: stripped,
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
