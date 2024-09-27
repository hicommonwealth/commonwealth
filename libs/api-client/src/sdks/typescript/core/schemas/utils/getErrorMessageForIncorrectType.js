export function getErrorMessageForIncorrectType(value, expectedType) {
  return `Expected ${expectedType}. Received ${getTypeAsString(value)}.`;
}
function getTypeAsString(value) {
  if (Array.isArray(value)) {
    return 'list';
  }
  if (value === null) {
    return 'null';
  }
  switch (typeof value) {
    case 'string':
      return `"${value}"`;
    case 'number':
    case 'boolean':
    case 'undefined':
      return `${value}`;
  }
  return typeof value;
}
