import React, { FC, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWTab, CWTabBar } from '../../../client/scripts/views/components/component_kit/cw_tabs';

const tabs = {
  title: 'Molecules/Tabs',
  component: CWTab,
} satisfies Meta<typeof CWTab>;

export default tabs;
// type Story = StoryObj<typeof tabs>;

const Tabs: FC = () => {
  const [selectedTab, setSelectedTab] = useState<number>(1);

  return (
    <CWTabBar>
      <CWTab
        label="A tab"
        onClick={() => setSelectedTab(1)}
        isSelected={selectedTab === 1}
      />
      <CWTab
        label="Another tab"
        onClick={() => setSelectedTab(2)}
        isSelected={selectedTab === 2}
      />
      <CWTab
        label="Yet another tab"
        onClick={() => setSelectedTab(3)}
        isSelected={selectedTab === 3}
      />
    </CWTabBar>
  )
}

// export const Tab: Story = {
export const Tab = {
  name: 'Tabs',
  render: () => <Tabs />
}
