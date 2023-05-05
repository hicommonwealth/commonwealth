import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWDropdown } from '../../../client/scripts/views/components/component_kit/cw_dropdown';

const dropdown = {
  title: 'Organisms/Dropdown',
  component: CWDropdown,
} satisfies Meta<typeof CWDropdown>;

export default dropdown;
// type Story = StoryObj<typeof dropdown>;

// export const DropdownStory: Story = {
export const MinhasBolas = {
  name: 'Dropdown',
  render: () => (
    <CWDropdown
      label="Dropdown"
      options={[
        { label: 'Dropdown Option 1', value: 'dropdownOption1' },
        { label: 'Dropdown Option 2', value: 'dropdownOption2' },
        { label: 'Dropdown Option 3', value: 'dropdownOption3' },
      ]}
      onSelect={(item) => console.log('Selected option: ', item.label)}
    />
  )
}
