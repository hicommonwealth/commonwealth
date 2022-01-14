import { Vnode } from 'mithril';

export type State = Record<string, unknown>;

export enum ComponentType {
  Button = 'Button',
  GradientButton = 'GradientButton',
  ButtonGroup = 'ButtonGroup',
  ExternalLink = 'ExternalLink',
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

export enum LinkType {
  Button = 'button',
  Inline = 'inline',
}

export type ExternalLinkProps = {
  label: string;
  target: string;
  linkType: LinkType;
};

export enum EngagementButtonSize {
  Small = 'sm',
  Large = 'lg',
}
