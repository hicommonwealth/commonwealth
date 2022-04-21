export enum ComponentType {
  BodyText = 'BodyText',
  Button = 'Button',
  ButtonGroup = 'ButtonGroup',
  Card = 'Card',
  DisplayText = 'DisplayText',
  EngagementButton = 'EngagementButton',
  ExternalLink = 'ExternalLink',
  GradientButton = 'GradientButton',
  HeadingText = 'HeadingText',
  Modal = 'Modal',
  RadioButton = 'RadioButton',
  RadioGroup = 'RadioGroup',
  Text = 'Text',
  TextInput = 'TextInput',
}

export type StyleAttrs = {
  disabled?: boolean;
  className?: string;
};

export type ButtonType = 'primary' | 'secondary';
