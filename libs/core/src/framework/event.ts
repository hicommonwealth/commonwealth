import { ZodError, ZodSchema } from 'zod';
import {
  EventContext,
  InvalidInput,
  PolicyMetadata,
  ProjectionMetadata,
} from './types';

/**
 * Generic event handler that adapts external protocols to conventional event context flows
 * - Protocol adapters should use this handler to enter the model
 * @param md event metadata
 * @param payload event payload
 * @param validate true to validate payload
 * @returns side effects
 * @throws {@link InvalidInput} when user invokes event with invalid payload, or rethrows internal domain errors
 */
export const event = async <T, P extends ZodSchema>(
  { schemas, body }: PolicyMetadata<T, P> | ProjectionMetadata<T, P>,
  { name, payload }: EventContext<P>,
  validate = true,
): Promise<Partial<T> | undefined> => {
  try {
    const context: EventContext<P> = {
      name,
      payload: validate ? schemas[name].parse(payload) : payload,
    };
    return (await body[name](context)) ?? undefined;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        const details = (error as ZodError).issues.map(
          ({ path, message }) => `${path.join('.')}: ${message}`,
        );
        throw new InvalidInput('Invalid event payload', details);
      }
      throw error;
    }
    throw new InvalidInput('Invalid event', [error as string]);
  }
};
