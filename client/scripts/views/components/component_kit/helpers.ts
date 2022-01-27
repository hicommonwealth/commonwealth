import { ButtonStyleAttrs } from './cw_button';
import { EngagementButtonStyleAttrs } from './cw_engagement_button';

export const getButtonClasses = (
  componentType: string,
  styleAttrs: ButtonStyleAttrs | EngagementButtonStyleAttrs
): string =>
  `${componentType} ${Object.entries(styleAttrs)
    .filter(([key, value]) => key && value) // filters out keys that don't have values
    .map(
      ([key, value]) =>
        key === 'disabled' ? (value === true ? 'disabled' : null) : value // returns disabled string instead of boolean
    )
    .join(' ')}`;
