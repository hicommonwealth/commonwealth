import { Requirement } from '@hicommonwealth/schemas';
import Ajv from 'ajv';
import { z } from 'zod';
import requirementsSchema from './requirementsSchema_v1';

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
  requirements: z.infer<typeof Requirement>[],
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
