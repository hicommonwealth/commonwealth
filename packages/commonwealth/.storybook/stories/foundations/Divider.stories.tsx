import React, { FC } from 'react';
import type { Meta } from '@storybook/react';

import { CWDivider } from '../../../client/scripts/views/components/component_kit/cw_divider';

import "../styles/divider.scss";

const divider = {
  title: "Foundations/Divider",
  component: CWDivider,
} satisfies Meta<typeof CWDivider>;

export default divider;

interface DividerProps {
  height: string;
}

const Divider: FC<DividerProps> = ({ height }) => {
  return (
    <CWDivider className={height === "2px" ? "thicker" : ""} />
  );
}

export const DividerStory = {
  name: "Divider",
  args: {
    height: "1px",
  },
  argTypes: {
    height: {
      control: { type: "radio" },
      options: [ "1px", "2px" ],
    },
  },
  parameters: {
    controls: { exclude: ["className", "isVertical"] },
  },
  render: ({...args}) => <Divider height={args.height} />,
};
