import React, { FC } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWCard } from "../../../client/scripts/views/components/component_kit/cw_card";
import { CWText } from "../../../client/scripts/views/components/component_kit/cw_text";

import "../../../client/styles/components/component_kit/cw_component_showcase.scss";
import "../styles/elevation.scss";
import "../styles/border.scss";

const card = {
  title: "Foundations/Border",
  component: CWCard,
} satisfies Meta<typeof CWCard>;

export default card;
type Story = StoryObj<any>;

interface BorderCardProps {
  border: string,
}

const options = {
  "Regular": {
    text: "Widgets",
    elevation: "elevation-1",
  },
  "With shadow": {
    text: "Dropdown, modals, menus",
    elevation: "elevation-3",
  },
}

const BorderCard: FC<BorderCardProps> = ({ border }) => {
  return (
    <div className="container">
      <CWCard className="card border" elevation={options[border].elevation} />
      <CWText className="text" isCentered>{options[border].text}</CWText>
    </div>
  )
}

export const Border: Story = {
  args: {
    border: "Regular",
  },
  argTypes: {
    border: {
      control: { type: "radio" },
      options: [ ...Object.keys(options) ],
    },
  },
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
  render: ({...args}) => <BorderCard border={args.border} />
}
