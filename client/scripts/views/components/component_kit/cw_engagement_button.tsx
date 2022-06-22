/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_engagement_button.scss';

import { CWIcon } from './cw_icons/cw_icon';
import { ComponentType, StyleAttrs } from './types';
import { getClasses } from './helpers';

export type EngagementButtonSize = 'sm' | 'lg';

export type EngagementButtonStyleAttrs = {
  buttonSize: EngagementButtonSize;
} & StyleAttrs;

type EngagementButtonAttrs = {
  label: string;
  onclick: (e?: MouseEvent) => void;
} & EngagementButtonStyleAttrs;

export class CWEngagementButton
  implements m.ClassComponent<EngagementButtonAttrs>
{
  view(vnode) {
    const {
      label,
      onclick,
      disabled = false,
      className,
      buttonSize,
    } = vnode.attrs;

    return (
      <button
        class={getClasses<EngagementButtonStyleAttrs>(
          {
            className,
            disabled,
            buttonSize,
          },
          ComponentType.EngagementButton
        )}
        onclick={onclick}
        disabled={disabled}
      >
        <CWIcon disabled={disabled} iconName="plus" />
        <span>{label}</span>
      </button>
    );
  }
}
