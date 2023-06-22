import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWSearchBar } from "../../../client/scripts/views/components/component_kit/cw_search_bar";

const searchbar = {
  title: "Components/SearchBar",
  component: CWSearchBar,
} satisfies Meta<typeof CWSearchBar>;

export default searchbar;
type Story = StoryObj<typeof searchbar>;

export const SearchBar: Story = {
  render: () => <CWSearchBar />,
};
