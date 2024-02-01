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
  constructor(public actor: Actor, message: string) {
    super(message);
    this.name = INVALID_ACTOR_ERROR;
  }
}

export class ServerError extends Error {
  status: number;
  // Optionally include the original error that was thrown
  error?: Error;
  constructor(message: string, error?: Error) {
    super(message);
    this.status = 500;
    this.name = 'ServerError';
    this.error = error;
  }
}

export class AppError extends Error {
  status: number;
  constructor(message: string) {
    super(message);
    this.status = 400;
    this.name = 'AppError';
  }
}
