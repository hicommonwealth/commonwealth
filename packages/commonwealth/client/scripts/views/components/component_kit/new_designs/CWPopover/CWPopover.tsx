import PopperUnstyled, {
  PopperOwnProps,
  PopperPlacementType,
} from '@mui/base/Popper';
import React from 'react';

import { uuidv4 } from 'lib/util';
import { ComponentType } from 'views/components/component_kit/types';

import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from '../../helpers';
import './CWPopover.scss';

export type AnchorType = HTMLElement | SVGSVGElement;

export type UsePopoverProps = {
  anchorEl: AnchorType;
  id: string;
  open: boolean;
  setAnchorEl: React.Dispatch<React.SetStateAction<AnchorType>>;
  handleInteraction: (e: React.MouseEvent<AnchorType>) => void;
};

// Developer can pass either:
// - content => results in unstyled popover (content is React Element that has to be styled)
// OR
// - title (optional) & body => styled popover by default
type ComponentInteriorProps =
  | {
      content: React.ReactNode;
      title?: never;
      body?: never;
    }
  | {
      content?: never;
      title?: string | React.ReactNode;
      body: React.ReactNode;
    };

type CWPopoverProps = {
  placement?: PopperPlacementType;
  disablePortal?: boolean;
  modifiers?: PopperOwnProps['modifiers'];
  className?: string;
} & UsePopoverProps &
  ComponentInteriorProps;

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
  className,
  placement,
  disablePortal,
  modifiers = [],
  title,
  body,
}: CWPopoverProps) => {
  const popoverContent = content || (
    <div
      className={getClasses<{ className?: string }>(
        { className },
        ComponentType.Popover,
      )}
    >
      {title && (
        <CWText type="caption" fontWeight="medium" className="popover-title">
          {title}
        </CWText>
      )}
      {body}
    </div>
  );

  return (
    <PopperUnstyled
      id={id}
      style={{ zIndex: 'unset' }}
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
      {popoverContent}
    </PopperUnstyled>
  );
};

export default CWPopover;
