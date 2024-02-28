import { ZodError } from 'zod';
import { events } from '../schemas';
import {
  EventContext,
  EventSchemas,
  EventsHandler,
  InvalidInput,
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
export const event = async <T, S extends EventSchemas, E extends events.Events>(
  { schemas, body }: EventsHandler<T, S>,
  { name, payload }: EventContext<E, typeof events.schemas[E]>,
  validate = true,
): Promise<Partial<T> | undefined> => {
  try {
    return (
      (await body[name]({
        name,
        payload: validate ? (schemas[name]!.parse(payload) as any) : payload,
      })) ?? undefined
    );
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
