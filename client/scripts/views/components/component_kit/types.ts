export type State = Record<string, unknown>;

export enum ComponentType {
  Button = 'Button',
  GradientButton = 'GradientButton',
}

export type StyleProps = {
  disabled?: boolean;
  className?: string;
};

export enum ButtonType {
  Primary = 'primary',
  Secondary = 'secondary',
}

export type ButtonStyleProps = {
  buttonType: ButtonType;
} & StyleProps;

export type ButtonProps = {
  styleProps: ButtonStyleProps;
  label: string;
  onclick: (e?: MouseEvent) => void;
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
