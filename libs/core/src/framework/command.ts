import z, { ZodError, ZodSchema } from 'zod';
import {
  CommandContext,
  CommandMetadata,
  InvalidInput,
  type Actor,
} from './types';

/**
 * Generic command handler that adapts external protocols to conventional command context flows
 * - Protocol adapters should use this handler to enter the model
 * @param md command metadata
 * @param id aggregate id
 * @param payload command payload
 * @param actor command actor
 * @returns resolved command context
 */
export const command = async <T, P extends ZodSchema>(
  { schema, load, body, save }: CommandMetadata<T, P>,
  id: string,
  payload: z.infer<P>,
  actor: Actor,
): Promise<CommandContext<T, P>> => {
  try {
    let context: CommandContext<T, P> = {
      id,
      actor,
      payload: schema.parse(payload),
    };
    for (const fn of load) {
      // can use deep clone to make it pure
      context = (await fn(context)) ?? context;
    }
    context = (await body(context)) ?? context;
    context = (await save(context)) ?? context;
    return context;
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
