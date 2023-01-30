/* @jsx jsx */
import React, { MouseEvent } from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/component_kit/cw_card.scss';
import { getClasses } from './helpers';

import { ComponentType } from './types';

export type CardElevation = 'elevation-1' | 'elevation-2' | 'elevation-3';

type CardStyleAttrs = {
  className?: string;
  elevation?: CardElevation;
  fullWidth?: boolean;
  interactive?: boolean;
};

// TODO: @ZAK @REACT is this type assumption ok?
type ReactMouseEvent = MouseEvent<HTMLDivElement>;

type CardAttrs = {
  onClick?: (e?: ReactMouseEvent) => void;
  onmouseover?: (e?: ReactMouseEvent) => void;
  onMouseEnter?: (e?: ReactMouseEvent) => void;
  onMouseLeave?: (e?: ReactMouseEvent) => void;
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
