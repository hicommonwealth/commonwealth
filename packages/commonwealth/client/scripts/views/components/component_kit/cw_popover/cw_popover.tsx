import React from 'react';
import PopperUnstyled from '@mui/base/Popper';
import type { Placement } from '@popperjs/core/lib';

import { uuidv4 } from 'lib/util';

export type AnchorType = HTMLElement | SVGSVGElement;

type UsePopoverProps = {
  anchorEl: AnchorType;
  id: string;
  open: boolean;
  setAnchorEl: React.Dispatch<React.SetStateAction<AnchorType>>;
  handleInteraction: (e: React.MouseEvent<AnchorType>) => void;
};

type PopoverProps = {
  content: React.ReactNode;
  placement?: Placement;
  disablePortal?: boolean;
} & UsePopoverProps;

export type PopoverTriggerProps = {
  renderTrigger: (
    handleInteraction: (e: React.MouseEvent<AnchorType>) => void
  ) => React.ReactNode;
};

export const usePopover = (): UsePopoverProps => {
  const [anchorEl, setAnchorEl] = React.useState<null | AnchorType>(null);

  const handleInteraction = (e: React.MouseEvent<AnchorType>) => {
    setAnchorEl(anchorEl ? null : e.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = open ? `popover-${uuidv4()}` : undefined;

  return {
    anchorEl,
    id,
    open,
    setAnchorEl,
    handleInteraction,
  };
};

export const Popover = ({
  anchorEl,
  content,
  id,
  open,
  placement,
  disablePortal,
}: PopoverProps) => {
  return (
    <PopperUnstyled
      id={id}
      open={open}
      anchorEl={anchorEl}
      disablePortal={disablePortal}
      placement={placement || 'bottom-start'}
      modifiers={[
        {
          name: 'preventOverflow',
          options: {
            padding: 16,
          },
        },
      ]}
    >
      {content}
    </PopperUnstyled>
  );
};
