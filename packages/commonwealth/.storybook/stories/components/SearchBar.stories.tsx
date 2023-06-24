import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWSearchBar } from "../../../client/scripts/views/components/component_kit/new_designs/cw_search_bar";

const searchbar = {
  title: "Components/SearchBar",
  component: CWSearchBar,
} satisfies Meta<typeof CWSearchBar>;

export default searchbar;
type Story = StoryObj<typeof searchbar>;

export const SearchBar: Story = {
  args: {
    placeholder: 'Search Common'
  },
  parameters: {
    controls: {
      exclude: [
        "autoComplete",
        "autoFocus",
        "containerClassName",
        "defaultValue",
        "value",
        "iconLeft",
        "iconLeftonClick",
        "inputValidationFn",
        "label",
        "name",
        "onInput",
        "onenterkey",
        "onClick",
        "tabIndex",
        "manualStatusMessage",
        "manualValidationStatus",
        "inputClassName",
        "displayOnly",
        "hasLeftIcon",
      ],
    },
  },
  render: (args) => <CWSearchBar {...args} />,
};
