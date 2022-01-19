/* @jsx m */

import m from 'mithril';
import 'components/component_kit/cw_card.scss';

import { ComponentType } from './types';

export enum CardElevation {
  Elevation1 = 'elevation-1',
  Elevation2 = 'elevation-2',
  Elevation3 = 'elevation-3',
}

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

const getCardClasses = (
  componentType: string,
  styleAttrs: CardStyleAttrs
): string =>
  `${componentType} ${Object.entries(styleAttrs)
    .filter(([key, value]) => key && value)
    .map(([key, value]) => {
      if (key === 'fullWidth') {
        return value === true ? 'full-width' : null;
      } else if (key === 'interactive') {
        return value === true ? 'interactive' : null;
      } else {
        return value;
      }
    })
    .join(' ')}`;

export const CWCard: m.Component<CardAttrs> = {
  view: (vnode) => {
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
        class={getCardClasses(ComponentType.Card, {
          elevation,
          fullWidth,
          className,
          interactive,
        })}
        onclick={onclick}
        onmouseover={onmouseover}
        onmouseenter={onmouseenter}
        onmouseleave={onmouseleave}
      >
        {vnode.children}
      </div>
    );
  },
};
