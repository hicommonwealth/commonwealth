export enum ComponentType {
  Button = 'Button',
  ButtonGroup = 'ButtonGroup',
  Card = 'Card',
  Checkbox = 'Checkbox',
  EngagementButton = 'EngagementButton',
  ExternalLink = 'ExternalLink',
  GradientButton = 'GradientButton',
  Icon = 'Icon',
  IconButton = 'IconButton',
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
