import { commonProtocolEventSchema } from '@hicommonwealth/evm-protocols';
import { events, Events } from '@hicommonwealth/schemas';
import { z, ZodError, ZodType, ZodUndefined } from 'zod';
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
  handler: EventsHandlerMetadata<Input, Output>,
  { id, name, payload }: EventContext<Name>,
  validate = true,
): Promise<Partial<z.infer<Output>>> => {
  // Override for common protocol because the inputs are a lookup to the
  // commonProtocolEventSchema
  let { inputs, body } = handler;
  if (!inputs && !body) {
    inputs = commonProtocolEventSchema;
    body = handler;
  }
  if (!body[name])
    throw new InvalidInput(
      `Unhandled event: ${name} not found in ${Object.keys(body)}`,
    );
  try {
    const validated = validate ? inputs[name]!.parse(payload) : payload;
    return (
      (await body[name]({
        id,
        name,
        payload: validated as z.infer<(typeof events)[Name]>,
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
