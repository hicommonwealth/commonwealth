import React, { FC, useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWTooltip } from "../../../client/scripts/views/components/component_kit/new_designs/cw_tooltip";
// import type { Placement } from "../../../client/scripts/views/components/component_kit/new_designs/cw_tooltip";

const tooltip = {
  title: "Components/Tooltip",
  component: CWTooltip,
} satisfies Meta<typeof CWTooltip>;

export default tooltip;
type Story = StoryObj<typeof tooltip>;

export const Tooltip: Story = {
  args: {
    content: "A tooltip is a non-actionable label for explaining a UI element or feature.",
    placement: "bottom",
  },
  render: ({...args}) => (
    <CWTooltip {...args} />
  ),
};
