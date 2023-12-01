import React from 'react';
import { AnchorType } from 'views/components/component_kit/new_designs/CWPopover';

interface MouseEnterOrLeaveProps {
  e: React.MouseEvent<AnchorType>;
  isMenuOpen?: boolean;
  isTooltipOpen?: boolean;
  handleInteraction: (e: React.MouseEvent<AnchorType>) => void;
}

interface HandleIconClickProps extends MouseEnterOrLeaveProps {
  onClick: (e: React.MouseEvent<AnchorType>) => void;
}
export const handleIconClick = ({
  e,
  isMenuOpen,
  isTooltipOpen,
  handleInteraction,
  onClick,
}: HandleIconClickProps) => {
  // close tooltip on menu click
  if (!isMenuOpen && isTooltipOpen) {
    handleInteraction(e);
  }
  onClick(e);
};

export const handleMouseEnter = ({
  e,
  isMenuOpen,
  handleInteraction,
}: MouseEnterOrLeaveProps) => {
  // prevent showing tooltip if menu is opened
  if (isMenuOpen) {
    return;
  }
  handleInteraction(e);
};

export const handleMouseLeave = ({
  e,
  isTooltipOpen,
  handleInteraction,
}: MouseEnterOrLeaveProps) => {
  // handleInteraction just toggles the value, so here prevent showing
  // the tooltip when you moving mouse away from the icon
  if (!isTooltipOpen) {
    return;
  }
  handleInteraction(e);
};
