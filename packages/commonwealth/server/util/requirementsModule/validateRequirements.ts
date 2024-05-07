import * as schemas from '@hicommonwealth/schemas';
import { Requirement } from '@hicommonwealth/shared';
import { z } from 'zod';
const Errors = {
  InvalidRequirements: 'Invalid requirements',
};
/**
 * validates a set of requirements against the schema
 * @param requirements an array of requirements types
 * @returns Error if invalid, otherwise null
 */
export default function validateRequirements(
  requirements: Requirement[],
): Error | null {
  const result = z.array(schemas.Requirement).safeParse(requirements);
  const error = 'error' in result && JSON.stringify(result.error.format());
  return error ? new Error(`${Errors.InvalidRequirements}: ${error}`) : null;
}
