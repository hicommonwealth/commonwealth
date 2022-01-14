/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_engagement_button.scss';

import { CreateIcon, IconSize, IconIntent } from './icons';
import { ComponentType, StyleProps } from './types';
import { getClasses } from './helpers';

export enum EngagementButtonSize {
  Small = 'sm',
  Large = 'lg',
}

export type EngagementButtonStyleProps = {
  size: EngagementButtonSize;
} & StyleProps;

type EngagementButtonProps = {
  label: string;
  onclick: (e?: MouseEvent) => void;
} & EngagementButtonStyleProps;

export const CWEngagementButton: m.Component<EngagementButtonProps> = {
  view: (vnode) => {
    const { label, onclick, disabled, className, size } = vnode.attrs;

    return (
      <button
        class={getClasses(ComponentType.EngagementButton, {
          className,
          disabled,
          size,
        })}
        onclick={onclick}
      >
        {m(CreateIcon, {
          size: IconSize.MD,
          disabled,
          intent: IconIntent.Primary,
        })}
        <span>{label}</span>
      </button>
    );
  },
};
