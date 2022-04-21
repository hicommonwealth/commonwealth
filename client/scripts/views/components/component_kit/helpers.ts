import { isNotUndefined } from 'helpers/typeGuards';

export const getClasses = <T>(styleAttrs: T, componentType?: string): string =>
  `${isNotUndefined(componentType) ? `${componentType} ` : ''}${Object.entries(
    styleAttrs
  )
    .filter(([key, value]) => isNotUndefined(key) && isNotUndefined(value))
    .map(([key, value]) =>
      typeof value === 'boolean' ? (value ? key : null) : value
    )
    .join(' ')}`;
