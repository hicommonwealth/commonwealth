import React, { FC, useEffect, useState } from 'react';
import type { Meta } from '@storybook/react';
import * as Icons from "@phosphor-icons/react";

import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';
import { CWButton } from '../../../client/scripts/views/components/component_kit/cw_button';
import { phosphorIconLookup } from '../phosphor_icon_lookup';

import "../styles/icon.scss";

interface PhosphorIconProps {
  size: number;
  weight: Icons.IconWeight | undefined;
};

interface GalleryProps {
  itemsPerRow: number;
  size: number;
  weight: Icons.IconWeight | undefined;
  searchTerm: string;
};

const weightOptions = ["thin", "regular", "fill" ];

const Gallery: FC<GalleryProps> = ({
  itemsPerRow,
  searchTerm,
  size,
  weight,
}) => {
  const totalOnFirstRender: number = 120;
  const [gallery, setGallery] = useState<any[]>([]);
  const [iconsFound, setIconsFound] = useState<number>(0);
  const [totalToRender, setTotalToRender] =
    useState<number>(totalOnFirstRender);

  useEffect(() => {
    let grid: any[] = [];
    let filteredIcons = Object.entries(phosphorIconLookup)
      .filter((key: any) => {
        let lowercaseKey: string = String(key).toLowerCase();
        return lowercaseKey.includes(searchTerm.toLowerCase());
      });
    setIconsFound(filteredIcons.length);
    
    let iconsToRender = filteredIcons
      .slice(0, totalToRender)
      .map(([key, icon], index) => {
        const IconComponent = icon;
        return (
          <div key={index} className="item">
            <IconComponent size={size} weight={weight} />
            <CWText className="name" type="caption">
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </CWText>
          </div>
        );
      });
    
    for (let i: number = 0; i < totalToRender; i += itemsPerRow) {
      let rowIcons: any[] = [];
      for (let j: number = 0; j < itemsPerRow; j++) {
        rowIcons.push(iconsToRender[j + i]);
      }
      grid.push(rowIcons);
    }
    
    setGallery(grid);
  }, [searchTerm, totalToRender]);

  const handleLoadMore = () => {
    setTotalToRender(
      totalToRender + totalOnFirstRender > iconsFound ?
        iconsFound :
        totalToRender + totalOnFirstRender
    );
  }

  return (
    <>
      <CWText className="results" type="caption">
        {`${iconsFound} results found`}
      </CWText>
      {gallery.map((row: any, i: number) => (
        <div key={i} className="row">
          {row.map((item: any, j: number) => (
            <div key={j}>{item}</div>
          ))}
        </div>
      ))}
      <div className="button">
        <CWButton
          label="Load more icons"
          onClick={() => handleLoadMore()}
          disabled={iconsFound < totalToRender}
        />
      </div>
    </>
  );
};

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
      <Gallery
        itemsPerRow={6}
        size={size}
        weight={weight}
        searchTerm={searchTerm}
      />
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
    size: 32,
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
