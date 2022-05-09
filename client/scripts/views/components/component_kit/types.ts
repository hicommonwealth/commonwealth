export enum ComponentType {
  Button = 'Button',
  ButtonGroup = 'ButtonGroup',
  Card = 'Card',
  EngagementButton = 'EngagementButton',
  ExternalLink = 'ExternalLink',
  GradientButton = 'GradientButton',
  Icon = 'Icon',
  IconButton = 'IconButton',
  Modal = 'Modal',
  Overlay = 'Overlay',
  Popover = 'Popover',
  RadioButton = 'RadioButton',
  RadioGroup = 'RadioGroup',
  Text = 'Text',
  TextInput = 'TextInput',
  Tooltip = 'Tooltip',
}

export type StyleAttrs = {
  disabled?: boolean;
  className?: string;
};

export type ButtonType = 'primary' | 'secondary';
