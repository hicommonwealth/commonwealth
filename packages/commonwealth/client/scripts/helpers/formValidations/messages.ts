export const VALIDATION_MESSAGES = {
  NO_INPUT: 'No input',
  MIN_CHAR_LIMIT_REQUIRED: (charLimit: number) =>
    `Minimum ${charLimit} characters required`,
  MAX_CHAR_LIMIT_REACHED: 'Max character limit reached',
  INVALID_INPUT: 'Invalid input',
  MUST_BE_TYPE: (type: string) => `Must be of ${type} type`,
  MUST_BE_GREATER: (value: string | number) => `Must be greater than ${value}`,
  MUST_BE_LESS_OR_EQUAL: (value: string | number) =>
    `Must be less or equal to ${value}`,
  MUST_BE_APART: (fieldName: string, differenceValue: string | number) =>
    `Must be atleast ${differenceValue} apart from ${fieldName}`,
};
