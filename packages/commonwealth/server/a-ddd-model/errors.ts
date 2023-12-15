import { Actor } from './actor';

export const INVALID_INPUT_ERROR = 'InvalidInputError';
export class InvalidInput extends Error {
  constructor(message: string) {
    super(message);
    this.name = INVALID_INPUT_ERROR;
  }
}

export const INVALID_ACTOR_ERROR = 'InvalidActorError';
export class InvalidActor extends Error {
  constructor(public actor: Actor, message: string) {
    super(message);
    this.name = INVALID_ACTOR_ERROR;
  }
}
