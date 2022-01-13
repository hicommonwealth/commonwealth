import { ButtonStyleProps } from './types';

export const getClasses = (
  componentType: string,
  styleProps: ButtonStyleProps
): string =>
  `${componentType} ${Object.entries(styleProps)
    .map(([key, value]) =>
      key === 'disabled' ? (value === true ? 'disabled' : '') : value
    )
    .join(' ')}`;
