/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_engagement_button.scss';

import { CreateIcon, IconSize, IconIntent } from './icons';
import { ComponentType, StyleAttrs } from './types';
import { getButtonClasses } from './helpers';

export enum EngagementButtonSize {
  Small = 'sm',
  Large = 'lg',
}

export type EngagementButtonStyleAttrs = {
  size: EngagementButtonSize;
} & StyleAttrs;

type EngagementButtonAttrs = {
  label: string;
  onclick: (e?: MouseEvent) => void;
} & EngagementButtonStyleAttrs;

export const CWEngagementButton: m.Component<EngagementButtonAttrs> = {
  view: (vnode) => {
    const { label, onclick, disabled, className, size } = vnode.attrs;

    return (
      <button
        class={getButtonClasses(ComponentType.EngagementButton, {
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
