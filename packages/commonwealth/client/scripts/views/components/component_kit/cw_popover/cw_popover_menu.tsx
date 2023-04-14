import ClickAwayListener from '@mui/base/ClickAwayListener';

import 'components/component_kit/cw_popover/cw_popover_menu.scss';
import React from 'react';
import { CWIcon } from '../cw_icons/cw_icon';
import { CWText } from '../cw_text';
import { getClasses } from '../helpers';

import type { DefaultMenuItem, DividerMenuItem, HeaderMenuItem, } from '../types';
import { ComponentType } from '../types';
import type { PopoverTriggerProps } from './cw_popover';
import { Popover, usePopover } from './cw_popover';

export type PopoverMenuItem =
  | DividerMenuItem
  | HeaderMenuItem
  | DefaultMenuItem;

type PopoverMenuProps = {
  menuItems: Array<PopoverMenuItem>;
} & PopoverTriggerProps;

export const PopoverMenu = (props: PopoverMenuProps) => {
  const { menuItems, renderTrigger } = props;

  const popoverProps = usePopover();

  return (
    <ClickAwayListener onClickAway={() => popoverProps.setAnchorEl(null)}>
      {/* needs to be div instead of fragment so listener can work */}
      <div>
        {renderTrigger(popoverProps.handleInteraction)}
        <Popover
          content={
            <div className={ComponentType.PopoverMenu}>
              {menuItems.map((item, i) => {
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
                        onClick(e);
                        popoverProps.handleInteraction(e);
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
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
