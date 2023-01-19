/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

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
  onClick?: (e?: MouseEvent) => void;
  onmouseover?: (e?: MouseEvent) => void;
  onMouseEnter?: (e?: MouseEvent) => void;
  onMouseLeave?: (e?: MouseEvent) => void;
} & CardStyleAttrs;

export class CWCard extends ClassComponent<CardAttrs> {
  view(vnode: ResultNode<CardAttrs>) {
    const {
      className,
      elevation,
      fullWidth,
      interactive = false,
      onClick,
      onMouseEnter,
      onMouseLeave,
      onmouseover,
    } = vnode.attrs;

    return (
      <div
        className={getClasses<CardStyleAttrs>(
          {
            elevation,
            fullWidth,
            interactive,
            className,
          },
          ComponentType.Card
        )}
        onClick={onClick}
        onMouseOver={onmouseover}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {vnode.children}
      </div>
    );
  }
}
