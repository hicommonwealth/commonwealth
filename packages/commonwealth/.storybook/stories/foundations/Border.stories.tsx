import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWCard } from "../../../client/scripts/views/components/component_kit/cw_card";

import "../styles/elevation.scss";
import "../styles/border.scss";

const card = {
  title: "Foundations/Border",
  component: CWCard,
} satisfies Meta<typeof CWCard>;

export default card;
type Story = StoryObj<any>;

export const Border: Story = {
  args: {},
  parameters: {
    controls: {
      exclude: [
        "className",
        "elevation",
        "fullWidth",
        "interactive",
        "onClick",
        "onmouseover",
        "onMouseEnter",
        "onMouseLeave",
      ],
    },
  },
  render: ({...args}) => <CWCard {...args} className="card border" />,
}
