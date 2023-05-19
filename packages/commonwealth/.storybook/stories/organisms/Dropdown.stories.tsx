import React, { FC } from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWDropdown } from '../../../client/scripts/views/components/component_kit/cw_dropdown';
import { DropdownItemType } from '../../../client/scripts/views/components/component_kit/cw_dropdown';
import { ArgsObject } from '../helpers';

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

const argsToOptions = (args: any) => {
  let arr: DropdownItemType[] = [];

  Object.values(args).map((option: any) => {
    let obj: DropdownItemType = {
      label: option as string,
      value: option,
    };
    arr.push(obj);
  });
  
  return arr;
}

const objectArrayToArgs = (
  controlLabel: string,
  arr: any[],
  objProperty: string,
) => {
  let obj: ArgsObject = {};

  for (let i: number = 0; i < arr.length; i++) {
    let property = controlLabel + " " + (i+1);
    obj[property] = arr[i][objProperty];
  }

  return obj;
}

const Dropdown: FC<DropdownProps> = (props) => {
  const { label, onSelect } = props;
  const options = (({ label, onSelect, ...o }) => o)(props);

  return (
    <CWDropdown
      label={label}
      options={argsToOptions(options)}
      onSelect={onSelect}
    />
  );
};

export const DropdownStory = {
  name: 'Dropdown',
  args: {
    label: "Dropdown",
    ...objectArrayToArgs("Option", options, "label"),
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
