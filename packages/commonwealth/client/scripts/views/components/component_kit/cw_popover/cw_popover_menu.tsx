import React, { useEffect } from 'react';

import ClickAwayListener from '@mui/base/ClickAwayListener';
import { PopperPlacementType, PopperOwnProps } from '@mui/base/Popper';

import 'components/component_kit/cw_popover/cw_popover_menu.scss';

import { ComponentType } from '../types';
import type {
  DefaultMenuItem,
  DividerMenuItem,
  HeaderMenuItem,
} from '../types';
import { getClasses } from '../helpers';
import { CWIcon } from '../cw_icons/cw_icon';
import { CWText } from '../cw_text';
import { Popover, usePopover } from './cw_popover';
import type { PopoverTriggerProps } from './cw_popover';

export type PopoverMenuItem =
  | DividerMenuItem
  | HeaderMenuItem
  | DefaultMenuItem;

type PopoverMenuProps = {
  menuItems: Array<PopoverMenuItem>;
  className?: string;
  onOpenChange?: (isOpen: boolean) => void;
  placement?: PopperPlacementType;
  modifiers?: PopperOwnProps['modifiers'];
} & PopoverTriggerProps;

export const PopoverMenu = ({
  menuItems,
  renderTrigger,
  className,
  onOpenChange,
  placement,
  modifiers,
}: PopoverMenuProps) => {
  const popoverProps = usePopover();
  const { open, setAnchorEl, handleInteraction } = popoverProps;

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  return (
    <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
      {/* needs to be div instead of fragment so listener can work */}
      <div className="popover-container">
        {renderTrigger(handleInteraction)}
        <Popover
          modifiers={modifiers}
          placement={placement}
          content={
            <div className={`${ComponentType.PopoverMenu} ${className}`}>
              {menuItems.map((item, i) => {
                if (item.type === 'header') {
                  return (
                    <CWText
                      className={`menu-section-header-text ${item.className}`}
                      type="caption"
                      key={i}
                    >
                      {item.label}
                    </CWText>
                  );
                } else if (item.type === 'divider') {
                  return (
                    <div
                      className={`menu-section-divider ${item.className}`}
                      key={i}
                    />
                  );
                } else {
                  const {
                    disabled,
                    isSecondary,
                    iconLeft,
                    iconLeftWeight,
                    label,
                    onClick,
                  } = item;
                  return (
                    <div
                      className={getClasses<{
                        disabled?: boolean;
                        isSecondary?: boolean;
                      }>(
                        { disabled, isSecondary },
                        `PopoverMenuItem ${item.className}`
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        onClick(e);

                        if (item.type === 'default' && item.preventClosing) {
                          return;
                        }

                        handleInteraction(e);
                      }}
                      key={i}
                    >
                      {iconLeft && (
                        <CWIcon
                          className="menu-item-icon"
                          iconName={iconLeft}
                          iconSize="small"
                          weight={iconLeftWeight}
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
