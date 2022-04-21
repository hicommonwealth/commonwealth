import { isBoolean, isNotUndefined } from 'helpers/typeGuards';

export const getClasses = <T>(styleAttrs: T, componentType?: string): string =>
  `${isNotUndefined(componentType) ? `${componentType} ` : ''}${Object.entries(
    styleAttrs
  )
    .filter(([key, value]) => isNotUndefined(key) && isNotUndefined(value))
    .map(([key, value]) => (isBoolean(value) ? (value ? key : null) : value))
    .join(' ')}`;
