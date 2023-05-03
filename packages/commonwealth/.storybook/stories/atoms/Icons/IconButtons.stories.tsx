import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWIcon } from '../../../../client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from '../../../../client/scripts/views/components/component_kit/cw_icon_button';
import { CWText } from '../../../../client/scripts/views/components/component_kit/cw_text';
import '../../../../client/styles/components/component_kit/cw_component_showcase.scss';

const icons = {
  title: 'Atoms/Icon buttons',
  component: CWIcon,
} satisfies Meta<typeof CWIcon>;

export default icons;
// type Story = StoryObj<typeof allIcons>;

const IconButton = (theme, number, selected, selectedFn) => {
  return (
    <div className="icon-button-row">
      <CWIconButton
        iconName="views"
        iconSize="large"
        iconButtonTheme={theme}
        selected={selected === number}
        onClick={() => {
          selectedFn(number);
        }}
      />
      {selected === number && (
        <div className="icon-button-selected">is selected</div>
      )}
    </div>
  );
}

const IconButtonGallery = () => {
  const [selectedIconButton, setSelectedIconButton] = useState<
    number | undefined
  >(undefined);

  return (
    <div className="icon-button-gallery">
      <CWText type="h3">Icon Buttons</CWText>
      <CWText>Click to see selected state</CWText>
      <div className="icon-button-row">
          <CWIconButton
            iconName="views"
            iconSize="large"
            iconButtonTheme="primary"
            selected={selectedIconButton === 1}
            onClick={() => {
              setSelectedIconButton(1);
            }}
          />
          {selectedIconButton === 1 && (
            <div className="icon-button-selected">is selected</div>
          )}
        </div>
        <div className="icon-button-row">
          <CWIconButton
            iconName="views"
            iconSize="large"
            iconButtonTheme="neutral"
            selected={selectedIconButton === 2}
            onClick={() => {
              setSelectedIconButton(2);
            }}
          />
          {selectedIconButton === 2 && (
            <div className="icon-button-selected">is selected</div>
          )}
        </div>
        <div className="icon-button-row">
          <CWIconButton
            iconName="views"
            iconSize="large"
            iconButtonTheme="black"
            selected={selectedIconButton === 3}
            onClick={() => {
              setSelectedIconButton(3);
            }}
          />
          {selectedIconButton === 3 && (
            <div className="icon-button-selected">is selected</div>
          )}
        </div>
      {/* <IconButton theme="primary" number={1} selected={selectedIconButton} selectedFn={setSelectedIconButton} />
      <IconButton theme="neutral" number={2} selected={selectedIconButton} selectedFn={setSelectedIconButton} />
      <IconButton theme="black" number={3} selected={selectedIconButton} selectedFn={setSelectedIconButton} /> */}
    </div>
  );
}

// export const IconButtons: Story = {
export const IconButtons = {
  name: 'Icon buttons',
  render: () => {
    return <IconButtonGallery />
  }
}
