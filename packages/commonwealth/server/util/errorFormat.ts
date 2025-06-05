import { ZodSafeParseError } from 'zod/v4';

export function formatErrorPretty(
  validationResult: ZodSafeParseError<any>,
): string {
  return validationResult.error.issues
    .map(({ path, message }) => `${path.join(': ')}: ${message}`)
    .join(', ');
}
