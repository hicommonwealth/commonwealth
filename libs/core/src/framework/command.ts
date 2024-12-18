import { z, ZodError, ZodSchema } from 'zod';
import { InvalidInput, type Context, type Metadata } from './types';

/**
 * Generic command handler that adapts external protocols to conventional command context flows
 * - Protocol adapters should use this handler to enter the model
 * @param md command metadata
 * @param payload command payload
 * @param actor command actor
 * @param id aggregate id
 * @param validate true to validate payload
 * @returns side effects
 * @throws {@link InvalidInput} when user invokes command with invalid payload or attributes, or rethrows internal domain errors
 */
export const command = async <
  Input extends ZodSchema,
  Output extends ZodSchema,
  _Context extends ZodSchema,
>(
  { input, auth, body }: Metadata<Input, Output, _Context>,
  { actor, payload }: Context<Input, _Context>,
  validate = true,
): Promise<z.infer<Output> | undefined> => {
  try {
    const context: Context<Input, _Context> = {
      actor,
      payload: validate ? input.parse(payload) : payload,
    };
    for (const fn of auth) {
      await fn(context);
    }
    return (await body(context)) ?? undefined;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        const details = (error as ZodError).issues.map(
          ({ path, message }) => `${path.join('.')}: ${message}`,
        );
        throw new InvalidInput('Invalid command payload', details);
      }
      throw error;
    }
    throw new InvalidInput('Invalid command', [error as string]);
  }
};
