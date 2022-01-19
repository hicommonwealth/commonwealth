export enum ComponentType {
  Button = 'Button',
  GradientButton = 'GradientButton',
  ButtonGroup = 'ButtonGroup',
  ExternalLink = 'ExternalLink',
  RadioButton = 'RadioButton',
  RadioGroup = 'RadioGroup',
  EngagementButton = 'EngagementButton',
  Card = 'Card',
}

export type StyleProps = {
  disabled?: boolean;
  className?: string;
};

export enum ButtonType {
  Primary = 'primary',
  Secondary = 'secondary',
}
