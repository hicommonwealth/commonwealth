import { Requirement } from './requirmentsTypes';

export default function validateRequirements(
  requirements: Requirement[]
): requirements is Requirement[] {
  return true;
}
