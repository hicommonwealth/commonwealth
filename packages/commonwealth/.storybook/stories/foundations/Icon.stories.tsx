import React, { FC, useState } from 'react';
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
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleChange = (e: any) => setSearchTerm(e.target.value);

  const handleSubmit = (e: any) => e.preventDefault();

  return (
    <>
      <form onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          value={searchTerm}
          onChange={handleChange}
          autoComplete="on"
          placeholder="Search icons..."
        />
      </form>
      <div className="gallery">
        {Object.entries(phosphorIconLookup)
          .filter((key: any) => {
            let lowercaseKey: string = String(key).toLowerCase();
            return lowercaseKey.includes(searchTerm.toLowerCase());
          })
          .map(([key, icon], index) => {
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
    </>
  );
}

const icon = {
  title: "Foundations/Icon",
  component: PhosphorIcon,
} satisfies Meta<typeof PhosphorIcon>;

export default icon;

export const PhosphorIconStory = {
  name: "Icon",
  args: {
    size: 24,
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
