import React, { FC } from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWDropdown } from '../../../client/scripts/views/components/component_kit/cw_dropdown';
import { DropdownItemType } from '../../../client/scripts/views/components/component_kit/cw_dropdown';

const dropdown = {
  title: 'Organisms/Dropdown',
  component: CWDropdown,
} satisfies Meta<typeof CWDropdown>;

export default dropdown;
type Story = StoryObj<typeof dropdown>;

interface DropdownProps {
  label: string | undefined,
  options: DropdownItemType[],
  onSelect: ((item: DropdownItemType) => void) | undefined,
};

const Dropdown: FC<DropdownProps> = (props) => {
  const { label, options, onSelect } = props;
  return (
    <CWDropdown
      label={label}
      options={options}
      onSelect={onSelect}
    />
  );
};

export const DropdownStory: Story = {
  name: 'Dropdown',
  args: {
    label: "Dropdown",
    options: [
      { label: 'Dropdown Option 1', value: 'dropdownOption1' },
      { label: 'Dropdown Option 2', value: 'dropdownOption2' },
      { label: 'Dropdown Option 3', value: 'dropdownOption3' },
    ],
    onSelect: (item: DropdownItemType) => console.log('Selected option: ', item?.label),
  },
  argTypes: {
    label: {
      control: { type: "text" },
    },
  },
  parameters: {
    controls: {
      exclude: [
        "initialValue",
        "containerClassName",
        "disabled",
      ],
    }
  },
  render: ({...args}) => (
    <Dropdown
      label={args.label}
      options={args.options}
      onSelect={args.onSelect}
    />
  )
};
