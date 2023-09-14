import Ajv from 'ajv';
import { Requirement } from './requirementsTypes';
import requirementsSchema from './requirementsSchema.json';
import { AppError } from '../../../../common-common/src/errors';

const Errors = {
  InvalidRequirements: 'Invalid requirements',
};

const ajv = new Ajv();

/**
 * validates a set of requirements against the schema
 * @param requirements an array of requirements types
 * @returns nothing
 * @throws AppError if invalid
 */
export default function validateRequirements(requirements: Requirement[]) {
  const validate = ajv.compile(requirementsSchema);
  const isValid = validate(requirements);
  if (!isValid) {
    throw new AppError(
      `${Errors.InvalidRequirements}: ${JSON.stringify(validate.errors)}`
    );
  }
}
