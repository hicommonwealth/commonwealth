import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import {
  CWToggle,
  toggleDarkMode,
} from '../../../client/scripts/views/components/component_kit/cw_toggle';

const toggle = {
  title: 'Atoms/Toggle',
  component: CWToggle,
} satisfies Meta<typeof CWToggle>;

export default toggle;
type Story = StoryObj<typeof toggle>;

const Toggle = () => {
  const [isToggled, setIsToggled] = useState<boolean>(false);

  return (
    <CWToggle
      checked={isToggled}
      onChange={() => {
        setIsToggled(!isToggled);
      }}
    />
  );
};

const DarkModeToggle = () => {
  const [isDarkModeOn, setIsDarkModeOn] = useState<boolean>(
    localStorage.getItem('dark-mode-state') === 'on'
  );

  return (
    <CWToggle
      checked={isDarkModeOn}
      onChange={(e) => {
        isDarkModeOn
          ? toggleDarkMode(false, setIsDarkModeOn)
          : toggleDarkMode(true, setIsDarkModeOn);
        e.stopPropagation();
      }}
    />
  );
};

export const Simple: Story = {
  name: 'Simple',
  render: () => <Toggle />,
};

export const DarkMode: Story = {
  name: 'Dark Mode',
  render: () => <DarkModeToggle />,
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => <CWToggle disabled />,
};

export const CheckedDisabled: Story = {
  name: 'Checked Disabled',
  render: () => <CWToggle checked disabled />,
};
