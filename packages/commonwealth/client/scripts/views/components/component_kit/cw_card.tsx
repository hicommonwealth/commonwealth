/* @jsx m */

import m from 'mithril';
import { ClassComponent, ResultNode, render, setRoute, redraw } from 'mithrilInterop';

import 'components/component_kit/cw_card.scss';

import { ComponentType } from './types';
import { getClasses } from './helpers';

export type CardElevation = 'elevation-1' | 'elevation-2' | 'elevation-3';

type CardStyleAttrs = {
  className?: string;
  elevation?: CardElevation;
  fullWidth?: boolean;
  interactive?: boolean;
};

type CardAttrs = {
  onclick?: (e?: MouseEvent) => void;
  onmouseover?: (e?: MouseEvent) => void;
  onmouseenter?: (e?: MouseEvent) => void;
  onmouseleave?: (e?: MouseEvent) => void;
} & CardStyleAttrs;

export class CWCard extends ClassComponent<CardAttrs> {
  view(vnode: ResultNode<CardAttrs>) {
    const {
      className,
      elevation,
      fullWidth,
      interactive = false,
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
            interactive,
            className,
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
