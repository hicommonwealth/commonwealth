import React, { FC } from 'react';
import type { Meta } from '@storybook/react';
import * as Icons from "@phosphor-icons/react";

import { phosphorIconLookup } from '../phosphor_icon_lookup';

import "../styles/icon.scss";

interface PhosphorIconProps {
  size: number;
  weight: Icons.IconWeight | undefined;
  component?: any;
};

const weightOptions = ["thin", "light", "regular", "bold", "fill", "duotone" ];

// const PhosphorIcon: FC<PhosphorIconProps> = ({ size, weight, component }) => {
const PhosphorIcon: FC<PhosphorIconProps> = ({ size, weight }) => {
  return (
    <>
      {Object.values(phosphorIconLookup).map(i => {
        const IconComponent = i;
        return (
          <div className="icon">
            <IconComponent size={size} weight={weight} />
          </div>
        )
      })}
    </>
  )
}

const icon = {
  title: "Foundations/Icon",
  component: PhosphorIcon,
} satisfies Meta<typeof PhosphorIcon>;

export default icon;

export const PhosphorIconStory = {
  name: "Icon",
  args: {
    size: 16,
    weight: "regular",
  },
  argTypes: {
    size: {
      control: { type: "inline-radio" },
      options: [ 16, 20, 24],
    },
    weight: {
      control: { type: "inline-radio" },
      options: weightOptions,
    },
  },
  parameters: {
    controls: { exclude: ["className", "isVertical"] },
  },
  render: ({...args}) => (
    <PhosphorIcon size={args.size} weight={args.weight} />
  ),
};
