/* @jsx jsx */
import React from 'react';

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
import ClickAwayListener from '@mui/base/ClickAwayListener';

import 'components/component_kit/cw_popover/cw_popover_menu.scss';

import { ReactPopover } from './cw_popover';
import {
  ComponentType,
  DefaultMenuItem,
  DividerMenuItem,
  HeaderMenuItem,
} from '../types';
import { getClasses } from '../helpers';
import { CWIcon } from '../cw_icons/cw_icon';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';
import type { MenuItem } from '../types';
import { ComponentType } from '../types';

import type { SharedPopoverAttrs } from './cw_popover';
import { CWPopover } from './cw_popover';

export type PopoverMenuItem =
  | DividerMenuItem
  | HeaderMenuItem
  | DefaultMenuItem;

export const PopoverMenu = (props: {
  renderTrigger: (onClick: () => void) => React.ReactNode;
  menuItems: Array<PopoverMenuItem>;
}) => {
  const [triggerEl, setTriggerEl] = React.useState<null | HTMLElement>(null);

  const handleToggle = (e?: React.MouseEvent<HTMLElement>) => {
    setTriggerEl(triggerEl ? null : e.currentTarget);
  };

  return (
    <ClickAwayListener onClickAway={() => setTriggerEl(null)}>
      {/* needs to be div instead of fragment so listener can work */}
      <div>
        {props.renderTrigger(handleToggle)}
        <ReactPopover
          content={
            <div className={ComponentType.PopoverMenu}>
              {props.menuItems.map((item, i) => {
                if (item.type === 'header') {
                  return (
                    <CWText
                      className="menu-section-header-text"
                      type="caption"
                      key={i}
                    >
                      {item.label}
                    </CWText>
                  );
                } else if (item.type === 'divider') {
                  return <div className="menu-section-divider" key={i} />;
                } else {
                  const { disabled, isSecondary, iconLeft, label, onClick } =
                    item;
                  return (
                    <div
                      className={getClasses<{
                        disabled?: boolean;
                        isSecondary?: boolean;
                      }>({ disabled, isSecondary }, 'PopoverMenuItem')}
                      onClick={(e) => {
                        onClick();
                        handleToggle(e);
                      }}
                      key={i}
                    >
                      {iconLeft && (
                        <CWIcon
                          className="menu-item-icon"
                          iconName={iconLeft}
                          iconSize="small"
                        />
                      )}
                      <CWText type="b2" className="menu-item-text">
                        {label}
                      </CWText>
                    </div>
                  );
                }
              })}
            </div>
          }
          anchorEl={triggerEl}
        />
      </div>
    </ClickAwayListener>
  );
};
