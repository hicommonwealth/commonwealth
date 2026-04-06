/**
 * Sample usage: Input = 'CommunityJoined', Output = 'Community Joined'
 * @param str
 * @returns
 */
export function splitCamelOrPascalCase(str): string {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2');
}
