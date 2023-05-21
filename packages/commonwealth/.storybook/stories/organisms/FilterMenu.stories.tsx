import React, { FC, useState } from 'react';
import type { Meta } from "@storybook/react";

import { CWFilterMenu } from '../../../client/scripts/views/components/component_kit/cw_popover/cw_filter_menu';
import type { CheckboxType } from '../../../client/scripts/views/components/component_kit/cw_checkbox';
import { argsToOptions, objectArrayToArgs } from '../helpers';

interface FilterMenuProps {
  header: string;
};

const filter = {
  title: 'Organisms/Filter Menu',
  component: CWFilterMenu,
} satisfies Meta<typeof CWFilterMenu>;

export default filter;

const checkboxGroupOptions: Array<CheckboxType> = [
  {
    label: 'Discussion',
    value: 'discussion',
  },
  {
    label: 'Pre Voting',
    value: 'preVoting',
  },
  {
    label: 'In Voting',
    value: 'inVoting',
  },
  {
    label: 'Passed',
    value: 'passed',
  },
  {
    label: 'Failed',
    value: 'failed',
  },
];

const FilterMenu: FC<FilterMenuProps> = (props) => {
  const { header } = props;
  const options = (({ header, ...o }) => o)(props);
  const [checkboxGroupSelected, setCheckboxGroupSelected] = useState<
    Array<string>
  >([]);

  return (
    <CWFilterMenu
      header={header}
      filterMenuItems={
        argsToOptions<CheckboxType>(options, "label", "value")
      }
      selectedItems={checkboxGroupSelected}
      onChange={(e) => {
        const itemValue = e.target.value;
        if (checkboxGroupSelected.indexOf(itemValue) === -1) {
          checkboxGroupSelected.push(itemValue);
        } else {
          setCheckboxGroupSelected(
            checkboxGroupSelected.filter((item) => item !== itemValue)
          );
        }
      }}
    />
  )
};

export const FilterMenuStory = {
  name: 'Filter Menu',
  args: {
    header: "Stages",
    ...objectArrayToArgs(checkboxGroupOptions, "label", "Filter")
  },
  argTypes: {
    header: {
      control: { type: "text" },
    }
  },
  parameters: {
    controls: {
      exclude: [
        "filterMenuItems",
        "onChange",
        "selectedItems",
      ],
    }
  },
  render: ({...args}) => <FilterMenu {...args} header={args.header} />,
};
