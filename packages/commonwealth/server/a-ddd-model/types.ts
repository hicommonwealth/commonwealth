import { z, ZodSchema } from 'zod';
import { Actor } from './actor';

/**
 * Command signature
 * @param actor the command actor
 * @param id the aggregate id
 * @param payload the command payload
 */
export type Command<M extends ZodSchema, R> = (
  actor: Actor,
  id: string,
  payload: z.infer<M>,
) => Promise<R>;
