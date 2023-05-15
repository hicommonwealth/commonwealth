import React, { FC, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWTab, CWTabBar } from '../../../client/scripts/views/components/component_kit/cw_tabs';

const tabs = {
  title: 'Molecules/Tabs',
  component: CWTab,
} satisfies Meta<typeof CWTab>;

export default tabs;
type Story = StoryObj<any>;

interface TabsProps {
  label1: string,
  label2: string,
  label3: string,
}

const Tabs: FC<TabsProps> = (props) => {
  const { label1, label2, label3, } = props;
  const [selectedTab, setSelectedTab] = useState<number>(1);

  return (
    <CWTabBar>
      <CWTab
        label={label1}
        onClick={() => setSelectedTab(1)}
        isSelected={selectedTab === 1}
      />
      <CWTab
        label={label2}
        onClick={() => setSelectedTab(2)}
        isSelected={selectedTab === 2}
      />
      <CWTab
        label={label3}
        onClick={() => setSelectedTab(3)}
        isSelected={selectedTab === 3}
      />
    </CWTabBar>
  )
}

export const Tab: Story = {
  name: 'Tabs',
  args: {
    label1: "A tab",
    label2: "Another tab",
    label3: "Yet another tab",
  },
  argTypes: {
    label1: {
      control: { type: "text" },
    },
    label2: {
      control: { type: "text" },
    },
    label3: {
      control: { type: "text" },
    },
  },
  render: ({...args}) => (
    <Tabs
      label1={args.label1}
      label2={args.label2}
      label3={args.label3}
    />
  )
}
