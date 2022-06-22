/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_card.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';

export type CardElevation = 'elevation-1' | 'elevation-2' | 'elevation-3';

type CardStyleAttrs = {
  elevation?: CardElevation;
  fullWidth?: boolean;
  className?: string;
  interactive?: boolean;
};

type CardAttrs = {
  onclick?: (e?: MouseEvent) => void;
  onmouseover?: (e?: MouseEvent) => void;
  onmouseenter?: (e?: MouseEvent) => void;
  onmouseleave?: (e?: MouseEvent) => void;
} & CardStyleAttrs;

export class CWCard implements m.ClassComponent<CardAttrs> {
  view(vnode) {
    const {
      className,
      elevation,
      fullWidth,
      interactive,
      onclick,
      onmouseenter,
      onmouseleave,
      onmouseover,
    } = vnode.attrs;

    return (
      <div
        class={getClasses<CardStyleAttrs>(
          {
            elevation,
            fullWidth,
            className,
            interactive,
          },
          ComponentType.Card
        )}
        onclick={onclick}
        onmouseover={onmouseover}
        onmouseenter={onmouseenter}
        onmouseleave={onmouseleave}
      >
        {vnode.children}
      </div>
    );
  }
}
