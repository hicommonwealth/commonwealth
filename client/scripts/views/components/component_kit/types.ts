export enum ComponentType {
  Button = 'Button',
  ButtonGroup = 'ButtonGroup',
  Card = 'Card',
  EngagementButton = 'EngagementButton',
  ExternalLink = 'ExternalLink',
  GradientButton = 'GradientButton',
  Overlay = 'Overlay',
  RadioButton = 'RadioButton',
  RadioGroup = 'RadioGroup',
  TextInput = 'TextInput',
}

export type StyleAttrs = {
  disabled?: boolean;
  className?: string;
};

export type ButtonType = 'primary' | 'secondary';
