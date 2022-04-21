import { isBoolean, isNil, isNotUndefined } from 'helpers/typeGuards';

export const getClasses = <T>(styleAttrs: T, componentType?: string): string =>
  `${isNotUndefined(componentType) ? `${componentType} ` : ''}${Object.entries(
    styleAttrs
  )
    .filter(([key, value]) => !isNil(key) && !isNil(value))
    .map(([key, value]) => (isBoolean(value) ? (value ? key : null) : value))
    .join(' ')}`;
