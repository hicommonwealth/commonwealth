import { ButtonStyleAttrs } from './cw_button';
import { EngagementButtonStyleAttrs } from './cw_engagement_button';
import { IconStyleAttrs } from './cw_icons/cw_icon';
import { InputStyleAttrs } from './cw_text_input';

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

export const getIconClasses = (styleAttrs: IconStyleAttrs): string =>
  `${Object.entries(styleAttrs)
    .filter(([key, value]) => key && value) // filters out keys that don't have values
    .map(
      ([key, value]) =>
        key === 'disabled' ? (value === true ? 'disabled' : null) : value // returns disabled string instead of boolean
    )
    .join(' ')}`;

export const getTextInputClasses = (styleAttrs: InputStyleAttrs): string =>
  `${Object.entries(styleAttrs)
    .filter(([key, value]) => key && value) // filters out keys that don't have values
    .map(
      ([key, value]) =>
        key === 'disabled' ? (value === true ? 'disabled' : null) : value // returns disabled string instead of boolean
    )
    .join(' ')}`;
