import PopperUnstyled, {
  PopperOwnProps,
  PopperPlacementType,
} from '@mui/base/Popper';
import React from 'react';

import { uuidv4 } from 'lib/util';
import { ComponentType } from 'views/components/component_kit/types';

export type AnchorType = HTMLElement | SVGSVGElement;

type UsePopoverProps = {
  anchorEl: AnchorType;
  id: string;
  open: boolean;
  setAnchorEl: React.Dispatch<React.SetStateAction<AnchorType>>;
  handleInteraction: (e: React.MouseEvent<AnchorType>) => void;
};

type CWPopoverProps = {
  content: React.ReactNode;
  placement?: PopperPlacementType;
  disablePortal?: boolean;
  modifiers?: PopperOwnProps['modifiers'];
} & UsePopoverProps;

export type PopoverTriggerProps = {
  renderTrigger: (
    handleInteraction: (e: React.MouseEvent<AnchorType>) => void,
    isOpen?: boolean,
  ) => React.ReactNode;
};

export const usePopover = (): UsePopoverProps => {
  const [anchorEl, setAnchorEl] = React.useState<null | AnchorType>(null);

  const handleInteraction = (e: React.MouseEvent<AnchorType>) => {
    setAnchorEl(anchorEl ? null : e.currentTarget);
  };

  const open = !!anchorEl;
  const id = open ? `popover-${uuidv4()}` : undefined;

  return {
    anchorEl,
    id,
    open,
    setAnchorEl,
    handleInteraction,
  };
};

const CWPopover = ({
  anchorEl,
  content,
  id,
  open,
  placement,
  disablePortal,
  modifiers = [],
}: CWPopoverProps) => {
  return (
    <PopperUnstyled
      className={ComponentType.Popover}
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
        ...modifiers,
      ]}
    >
      {content}
    </PopperUnstyled>
  );
};

export default CWPopover;
