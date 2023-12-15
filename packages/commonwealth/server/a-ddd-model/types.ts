import { Actor } from './actor';

/**
 * Command signature
 * @param actor the command actor
 * @param id the aggregate id
 * @param payload the command payload
 */
export type Command<
  M extends Record<string, any>,
  R extends Record<string, any>,
> = (actor: Actor, id: string, payload: M) => Promise<R>;
