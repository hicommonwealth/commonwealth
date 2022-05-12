export enum ComponentType {
  AccountCreationButton = 'AccountCreationButton',
  Button = 'Button',
  ButtonGroup = 'ButtonGroup',
  Card = 'Card',
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
  WalletOptionRow = 'WalletOptionRow',
}

export type StyleAttrs = {
  disabled?: boolean;
  className?: string;
};

export type ButtonType = 'primary' | 'secondary';
