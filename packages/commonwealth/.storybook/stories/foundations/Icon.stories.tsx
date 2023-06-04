import React, { FC } from 'react';
import type { Meta } from '@storybook/react';
import * as Icons from "@phosphor-icons/react";

import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';
import { phosphorIconLookup } from '../phosphor_icon_lookup';

import "../styles/icon.scss";

interface PhosphorIconProps {
  size: number;
  weight: Icons.IconWeight | undefined;
};

const weightOptions = ["thin", "light", "regular", "bold", "fill", "duotone" ];

const PhosphorIcon: FC<PhosphorIconProps> = ({ size, weight }) => {
  return (
    <div className="gallery">
      {Object.entries(phosphorIconLookup).map(([key, icon], index) => {
        const IconComponent = icon;
        return (
          <div key={index} className="item">
            <div className="icon">
              <IconComponent size={size} weight={weight} />
            </div>
            <CWText className="name" type="caption">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </CWText>
          </div>
        )
      })}
    </div>
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
