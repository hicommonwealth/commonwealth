/**
 * Sample usage: Input = 'SignUpFlowCompleted', Output = 'Sign Up Flow Completed'
 * @param str
 * @returns
 */
export function splitCamelOrPascalCase(str): string {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2');
}
