import { Vnode } from 'mithril';

export type State = Record<string, unknown>;

export enum ComponentType {
  Button = 'Button',
  GradientButton = 'GradientButton',
  ButtonGroup = 'ButtonGroup',
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

export type ButtonGroupProps = {
  children: Array<Vnode<ButtonProps, State>>;
};

export enum LinkStyle {
  Button = 'button',
  Inline = 'inline',
}

export enum EngagementButtonSize {
  Small = 'sm',
  Large = 'lg',
}
