import { isBoolean, isNotNil } from 'helpers/typeGuards';

export const getClasses = <T>(
  styleAttrs: T,
  componentType?: string
): string => {
  const type = isNotNil(componentType) ? [componentType] : [];
  const classes = Object.entries(styleAttrs)
    .filter(
      // filter out keys with undefined values
      // filter out false bools since we only want the class if true
      ([key, value]) => isNotNil(key) && isNotNil(value) && value !== false
    )
    // return the key if value is bool, otherwise return value
    .map(([key, value]) => (isBoolean(value) ? key : value));

  return type.concat(classes).join(' ');
};
