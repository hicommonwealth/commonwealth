import React, { FC } from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWDropdown } from '../../../client/scripts/views/components/component_kit/cw_dropdown';
import { DropdownItemType } from '../../../client/scripts/views/components/component_kit/cw_dropdown';
import { argsToOptions, objectArrayToArgs } from '../helpers';

const dropdown = {
  title: 'Organisms/Dropdown',
  component: CWDropdown,
} satisfies Meta<typeof CWDropdown>;

export default dropdown;

interface DropdownProps {
  label: string;
  onSelect: ((item: DropdownItemType) => void) | undefined;
};

const options: DropdownItemType[] = [
  { label: 'Dropdown Option 1', value: 'dropdownOption1' },
  { label: 'Dropdown Option 2', value: 'dropdownOption2' },
  { label: 'Dropdown Option 3', value: 'dropdownOption3' },
];

const Dropdown: FC<DropdownProps> = (props) => {
  const { label, onSelect } = props;
  const options = (({ label, onSelect, ...o }) => o)(props);

  return (
    <CWDropdown
      label={label}
      options={argsToOptions<DropdownItemType>(options, "label", "value")}
      onSelect={onSelect}
    />
  );
};

export const DropdownStory = {
  name: 'Dropdown',
  args: {
    label: "Dropdown",
    ...objectArrayToArgs(options, "label", "Option"),
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
        "containerClassName",
        "disabled",
        "initialValue",
        "onSelect",
        "options",
      ],
    }
  },
  render: ({...args}) => (
    <Dropdown
      {...args}
      label={args.label}
      onSelect={args.onSelect}
    />
  )
};
