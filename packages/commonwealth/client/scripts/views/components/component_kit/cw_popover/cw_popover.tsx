/* @jsx jsx */
import React from 'react';
import { PopperUnstyled } from '@mui/base';
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

import { uuidv4 } from 'lib/util';
import { TooltipType } from './cw_tooltip';

// export type PopoverInteractionType = 'click' | 'hover';

// export type SharedPopoverAttrs = {
//   hoverCloseDelay?: number;
//   hoverOpenDelay?: number;
//   interactionType?: PopoverInteractionType;
//   persistOnHover?: boolean;
//   tooltipType?: TooltipType;
//   toSide?: boolean;
//   trigger: Children;
// };

type AnchorType = HTMLElement | SVGSVGElement;

type UsePopoverProps = {
  anchorEl: AnchorType;
  id: string;
  open: boolean;
  setAnchorEl: React.Dispatch<React.SetStateAction<AnchorType>>;
  handleInteraction: (e: React.MouseEvent<AnchorType>) => void;
};

type PopoverProps = {
  content: Children;
} & UsePopoverProps;

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

export const Popover = (props: PopoverProps) => {
  const { anchorEl, content, id, open } = props;

  return (
    <PopperUnstyled
      id={id}
      open={open}
      anchorEl={anchorEl}
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

export class CWPopover extends ClassComponent {
  view() {
    return <div />;
  }
}
