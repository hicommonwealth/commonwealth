import { Actor } from './types';

export const INVALID_INPUT_ERROR = 'InvalidInputError';
export class InvalidInput extends Error {
  public details?: string[];
  constructor(message: string, details?: string[]) {
    super(message);
    this.name = INVALID_INPUT_ERROR;
    this.details = details;
  }
}

export const INVALID_ACTOR_ERROR = 'InvalidActorError';
export class InvalidActor extends Error {
  constructor(public actor: Actor<unknown>, message: string) {
    super(message);
    this.name = INVALID_ACTOR_ERROR;
  }
}
