export enum ComponentType {
  Button = 'Button',
  GradientButton = 'GradientButton',
  ButtonGroup = 'ButtonGroup',
  ExternalLink = 'ExternalLink',
  RadioButton = 'RadioButton',
  RadioGroup = 'RadioGroup',
  EngagementButton = 'EngagementButton',
  TextInput = 'TextInput',
}

export type StyleAttrs = {
  disabled?: boolean;
  className?: string;
};

export enum ButtonType {
  Primary = 'primary',
  Secondary = 'secondary',
}
