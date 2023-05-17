import React, { FC, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWTab, CWTabBar } from '../../../client/scripts/views/components/component_kit/cw_tabs';

const tabs = {
  title: 'Molecules/Tabs',
  component: CWTab,
} satisfies Meta<typeof CWTab>;

export default tabs;
type Story = StoryObj<any>;

const tabLabels = [ "A tab", "Another tab", "Yet another tab" ];

const argTypesObj = (strArray: string[], control: string) => {
  const obj = {};
  strArray.forEach((attribute) => {
    obj[attribute] = { control: { type: control } };
  });
  return obj;
};

interface TabsProps {
  tabLabels: string[],
}

const Tabs: FC<TabsProps> = ({tabLabels}) => {
  const [selectedTab, setSelectedTab] = useState<number>(1);

  return (
    <CWTabBar>
      {tabLabels.map((label, i) => (
        <CWTab
          key={i}
          label={label}
          onClick={() => setSelectedTab(i+1)}
          isSelected={selectedTab === i+1}
        />
      ))}
    </CWTabBar>
  )
}

export const Tab: Story = {
  name: 'Tabs',
  args: {
    tabLabels: tabLabels,
  },
  argTypes: { 
    ...argTypesObj(tabLabels, "text"),
  },
  parameters: {
    controls: { exclude: ["label", "disabled", "isSelected"] }
  },
  render: ({...args}) => <Tabs tabLabels={args.tabLabels} />
}
