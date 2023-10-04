import React, { FC } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWCard, CardElevation } from "../../../client/scripts/views/components/component_kit/cw_card";
import { CWText } from "../../../client/scripts/views/components/component_kit/cw_text";

import "../styles/elevation.scss";

const card = {
  title: "Foundations/Elevation",
  component: CWCard,
} satisfies Meta<typeof CWCard>;

export default card;
type Story = StoryObj<any>;

interface CardProps {
  elevation: CardElevation,
}

const options = {
  "XS": "elevation-1",
  "S": "elevation-2",
  "M": "elevation-3",
  "L": "elevation-4",
  "XL": "elevation-5",
}

const Card: FC<CardProps> = ({ elevation }) => {
  return (
    <div className="container">
      <CWCard className="card" elevation={options[elevation]} />
      <CWText className="text" isCentered>{elevation}</CWText>
    </div>
  )
}

export const Elevation: Story = {
  args: {
    elevation: "XS",
  },
  argTypes: {
    elevation: {
      control: { type: "inline-radio" },
      options: [ "XS", "S", "M", "L", "XL" ],
    },
  },
  parameters: {
    controls: {
      exclude: [
        "className",
        "fullWidth",
        "interactive",
        "onClick",
        "onmouseover",
        "onMouseEnter",
        "onMouseLeave",
      ],
    },
  },
  render: ({...args}) => <Card elevation={args.elevation} />
}
