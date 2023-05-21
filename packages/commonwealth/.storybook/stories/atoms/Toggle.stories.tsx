import React, { FC, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWToggle, toggleDarkMode } from '../../../client/scripts/views/components/component_kit/cw_toggle';
import type { ToggleStyleProps } from '../../../client/scripts/views/components/component_kit/cw_toggle';

const toggle = {
  title: 'Atoms/Toggle',
  component: CWToggle,
} satisfies Meta<typeof CWToggle>;

export default toggle;
type Story = StoryObj<typeof toggle>;

const Toggle: FC<ToggleStyleProps> = (args) => {
  const { checked, disabled } = args;
  const [isChecked, setIsChecked] = useState<boolean | undefined>(checked);

  useEffect(() => setIsChecked(checked), [checked]);

  return (
    <CWToggle
      checked={isChecked}
      disabled={disabled}
      onChange={(e) => {
        setIsChecked(!isChecked)
        e.stopPropagation();
      }}
    />
  );
}

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
  )
}

export const Simple: Story = {
  name: 'Overview',
  args: {
    checked: false,
    disabled: false,
  },
  argTypes: {
    checked: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
    disabled: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
  },
  parameters: {
    controls: {
      exclude: [ "className", "onChange", ],
    },
  },
  render: ({...args}) => <Toggle {...args} />,
};

export const DarkMode: Story = {
  name: 'Dark Mode',
  render: () => <DarkModeToggle />
};
