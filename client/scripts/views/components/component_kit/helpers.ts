import { ButtonStyleProps } from './cw_button';
import { EngagementButtonStyleProps } from './cw_engagement_button';

export const getButtonClasses = (
  componentType: string,
  styleProps: ButtonStyleProps | EngagementButtonStyleProps
): string =>
  `${componentType} ${Object.entries(styleProps)
    .filter(([key, value]) => key && value) // filters out keys that don't have values
    .map(
      ([key, value]) =>
        key === 'disabled' ? (value === true ? 'disabled' : null) : value // returns disabled string instead of boolean
    )
    .join(' ')}`;
