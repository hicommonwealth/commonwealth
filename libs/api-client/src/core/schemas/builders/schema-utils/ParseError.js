import { stringifyValidationError } from './stringifyValidationErrors';

export class ParseError extends Error {
  constructor(errors) {
    super(errors.map(stringifyValidationError).join('; '));
    this.errors = errors;
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}
