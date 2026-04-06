import { componentItems } from './componentsList';

type Item = (typeof componentItems)[0];

export const alphabetically = (a: Item, b: Item) =>
  a.displayName.localeCompare(b.displayName);

export const pascalCaseToNormalText = (input: string) => {
  // Add a space before each capital letter (except the first one)
  const result = input.replace(/([A-Z])/g, ' $1');

  // Convert the first letter to lowercase and trim any leading spaces
  return result.charAt(0).toLowerCase() + result.slice(1).trim();
};
