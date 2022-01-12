export enum ComponentType {
  Button = 'Button',
  GradientButton = 'GradientButton',
}

export enum ButtonType {
  Primary = 'primary',
  Secondary = 'secondary',
}

export type StyleProps = {
  buttonType: ButtonType;
  disabled?: boolean;
  className?: string;
};

export enum Justify {
  Right = 'right',
  Center = 'center',
  Left = 'left',
}

export enum LinkStyle {
  Button = 'button',
  Inline = 'inline',
}

export enum EngagementButtonSize {
  Small = 'sm',
  Large = 'lg',
}
