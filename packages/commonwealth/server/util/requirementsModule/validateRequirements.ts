import { Requirement } from '@hicommonwealth/shared';
import Ajv from 'ajv';
import requirementsSchema from './requirementsSchema_v1.json' assert { type: 'json' };

const Errors = {
  InvalidRequirements: 'Invalid requirements',
};

const ajv = new Ajv();

/**
 * validates a set of requirements against the schema
 * @param requirements an array of requirements types
 * @returns Error if invalid, otherwise null
 */
export default function validateRequirements(
  requirements: Requirement[],
): Error | null {
  const validate = ajv.compile(requirementsSchema);
  const isValid = validate(requirements);
  if (!isValid) {
    return new Error(
      `${Errors.InvalidRequirements}: ${JSON.stringify(validate.errors)}`,
    );
  }
  return null;
}
