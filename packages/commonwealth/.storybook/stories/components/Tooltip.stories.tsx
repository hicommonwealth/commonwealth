import React, { FC } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWButton } from '../../../client/scripts/views/components/component_kit/new_designs/cw_button';
import { CWTooltip } from "../../../client/scripts/views/components/component_kit/new_designs/cw_tooltip";
import type { Placement } from "../../../client/scripts/views/components/component_kit/new_designs/cw_tooltip";

import '../styles/tooltip.scss';

const tooltip = {
  title: "Components/Tooltip",
  component: CWTooltip,
} satisfies Meta<typeof CWTooltip>;

export default tooltip;
type Story = StoryObj<typeof tooltip>;

type TooltipProps = {
  content: string;
  placement: Placement;
  children?: any;
};

const Tooltip: FC<TooltipProps> = ({ content, placement }) => {
  const placementStr = String(placement);
  const btnLabel = placementStr[0].toUpperCase().concat(placementStr.slice(1));
  
  return (
    // <div className="Tooltip">
    <div
      style={
        {
          display: 'grid',
          alignItems: 'center',
          justifyContent: 'center',
          width: '600px',
          height: '300px',
        }
      }
    >
      <CWTooltip content={content} placement={placement} >
        <CWButton label={btnLabel} />
      </CWTooltip>
    </div>
  );
};

export const Overview: Story = {
  name: "Tooltip",
  args: {
    content: "A tooltip is a non-actionable label for explaining a UI element or feature.",
    placement: "bottom",
  },
  render: ({...args}) => (
    // <Tooltip {...args} />
    <Tooltip {...args} />
  ),
};
