import React, { useEffect } from 'react';

import ClickAwayListener from '@mui/base/ClickAwayListener';
import { PopperOwnProps, PopperPlacementType } from '@mui/base/Popper';

import './CWPopoverMenu.scss';

import MenuContent from 'views/components/component_kit/CWPopoverMenu/MenuContent';
import CWPopover, {
  PopoverTriggerProps,
  usePopover,
} from 'views/components/component_kit/new_designs/CWPopover';
import type {
  DefaultMenuItem,
  DividerMenuItem,
  HeaderMenuItem,
} from '../types';

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
        {renderTrigger(handleInteraction, open)}
        <CWPopover
          modifiers={modifiers}
          placement={placement}
          content={
            <MenuContent
              className={className}
              handleInteraction={handleInteraction}
              menuItems={menuItems}
            />
          }
          {...popoverProps}
        />
      </div>
    </ClickAwayListener>
  );
};
