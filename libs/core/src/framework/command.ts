import { ZodError, ZodSchema } from 'zod';
import { CommandContext, CommandMetadata, InvalidInput } from './types';

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
export const command = async <T, P extends ZodSchema>(
  { schema, auth, body }: CommandMetadata<T, P>,
  { id, actor, payload }: CommandContext<P>,
  validate = true,
): Promise<Partial<T> | undefined> => {
  try {
    const context: CommandContext<P> = {
      actor,
      payload: validate ? schema.parse(payload) : payload,
      id,
    };
    let state: Partial<T> | undefined = undefined;
    for (const fn of auth) {
      // can use deep clone to make it pure
      state = (await fn(context, state)) ?? state;
    }
    return (await body(context, state)) ?? undefined;
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
