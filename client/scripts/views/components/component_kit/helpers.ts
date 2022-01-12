import { StyleProps } from './types';

export const getClasses = (
  componentType: string,
  styleProps: StyleProps
): string =>
  `${componentType} ${Object.entries(styleProps)
    .map(([key, value]) =>
      key === 'disabled' ? (value === true ? 'disabled' : '') : value
    )
    .join(' ')}`;
