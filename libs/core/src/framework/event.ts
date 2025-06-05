import { Events } from '@hicommonwealth/schemas';
import { ZodError, ZodType, ZodUndefined, z } from 'zod/v4';
import {
  InvalidInput,
  type EventContext,
  type EventSchemas,
  type EventsHandlerMetadata,
} from './types';

/**
 * Generic utility that adapts external protocols to conventional event handling flows
 * - Protocol adapters should use this handler to enter the model
 * @param md event metadata
 * @param payload event payload
 * @param validate true to validate payload
 * @returns side effects
 * @throws {@link InvalidInput} when user invokes event with invalid payload, or rethrows internal domain errors
 */
export const handleEvent = async <
  Name extends Events,
  Input extends EventSchemas,
  Output extends ZodType | ZodUndefined = ZodUndefined,
>(
  { inputs, body }: EventsHandlerMetadata<Input, Output>,
  { name, payload }: EventContext<Name>,
  validate = true,
): Promise<Partial<z.infer<Output>>> => {
  if (!body[name])
    throw new InvalidInput(
      `Unhandled event: ${name} not found in ${Object.keys(body)}`,
    );
  try {
    return (
      (await body[name]({
        name,
        payload: validate ? inputs[name]!.parse(payload) : payload,
      })) || {}
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
