import { ButtonStyleProps } from './cw_button';
import { EngagementButtonStyleProps } from './cw_engagement_button';

export const getClasses = (
  componentType: string,
  styleProps: ButtonStyleProps | EngagementButtonStyleProps
): string =>
  `${componentType} ${Object.entries(styleProps)
    .map(([key, value]) =>
      key === 'disabled' ? (value === true ? 'disabled' : '') : value
    )
    .join(' ')}`;
