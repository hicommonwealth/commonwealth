import { SafeParseError } from 'zod';

export function formatErrorPretty(
  validationResult: SafeParseError<any>,
): string {
  return validationResult.error.issues
    .map(({ path, message }) => `${path.join(': ')}: ${message}`)
    .join(', ');
}
