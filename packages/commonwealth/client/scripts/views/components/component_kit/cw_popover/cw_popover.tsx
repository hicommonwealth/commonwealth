/* @jsx jsx */
import React from 'react';
import PopperUnstyled from '@mui/base/PopperUnstyled';

import 'components/component_kit/cw_popover/cw_popover.scss';


import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  Component,
  jsx,
  Children,
} from 'mithrilInterop';

import 'components/component_kit/cw_popover/cw_popover.scss';

import { getClasses } from '../helpers';
import { ComponentType } from '../types';
import type { TooltipType } from './cw_tooltip';
import {
  applyArrowStyles,
  cursorInBounds,
  findRef,
  getPosition,
} from './helpers';
import { CWPortal } from '../cw_portal';

export type PopoverInteractionType = 'click' | 'hover';

export type SharedPopoverAttrs = {
  hoverCloseDelay?: number;
  hoverOpenDelay?: number;
  interactionType?: PopoverInteractionType;
  persistOnHover?: boolean;
  tooltipType?: TooltipType;
  toSide?: boolean;
  trigger: Children;
};

type PopoverAttrs = {
  content: Children;
  onToggle?: (isOpen: boolean) => void;
} & SharedPopoverAttrs;

// const defaultHoverCloseDelay = 100;

export const ReactPopover = (props: {
  anchorEl: HTMLElement;
  content: Children;
}) => {
  const open = Boolean(props.anchorEl);
  const id = open ? 'simple-popper' : undefined;

  return (
    <PopperUnstyled
      id={id}
      open={open}
      anchorEl={props.anchorEl}
      modifiers={[
        {
          name: 'preventOverflow',
          options: {
            padding: 16,
          },
        },
      ]}
    >
      {props.content}
    </PopperUnstyled>
  );
};

export class CWPopover extends ClassComponent<PopoverAttrs> {
  view() {
    return <div />;
  }
}
