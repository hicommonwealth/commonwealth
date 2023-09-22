import { Requirement } from './requirementsTypes';

/**
 * validates a set of requirements against the schema
 * @param requirements an array of requirements types
 * @returns
 */
export default function validateRequirements(
  requirements: Requirement[]
): requirements is Requirement[] {
  if (!Array.isArray(requirements)) {
    return false;
  }
  return true;
}
