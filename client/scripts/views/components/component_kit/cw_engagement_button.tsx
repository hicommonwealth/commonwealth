/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_engagement_button.scss';

import { CWIcon } from './cw_icons/cw_icon';
import { ComponentType, StyleAttrs } from './types';
import { getButtonClasses } from './helpers';

export type EngagementButtonSize = 'sm' | 'lg';

export type EngagementButtonStyleAttrs = {
  buttonSize: EngagementButtonSize;
} & StyleAttrs;

type EngagementButtonAttrs = {
  label: string;
  onclick: (e?: MouseEvent) => void;
} & EngagementButtonStyleAttrs;

export const CWEngagementButton: m.Component<EngagementButtonAttrs> = {
  view: (vnode) => {
    const {
      label,
      onclick,
      disabled = false,
      className,
      buttonSize,
    } = vnode.attrs;

    return (
      <button
        class={getButtonClasses(ComponentType.EngagementButton, {
          className,
          disabled,
          buttonSize,
        })}
        onclick={onclick}
      >
        {m(CWIcon, {
          disabled,
          iconName: 'create',
        })}
        <span>{label}</span>
      </button>
    );
  },
};
