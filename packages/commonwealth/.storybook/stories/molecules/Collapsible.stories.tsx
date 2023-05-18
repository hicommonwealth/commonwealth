import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWCollapsible } from '../../../client/scripts/views/components/component_kit/cw_collapsible';
import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';

const collapsible = {
  title: 'Molecules/Collapsible',
  component: CWCollapsible,
} satisfies Meta<typeof CWCollapsible>;

export default collapsible;
// type Story = StoryObj<typeof collapsible>;

// export const Collapsible: Story = {
export const Collapsible = {
  args: {
    headerContent: "Header content",
    collapsibleContent: "Body content",
  },
  argTypes: {
    headerContent: {
      control: { type: "text" }
    },
    collapsibleContent: {
      control: { type: "text" }
    },
  },
  render: ({...args}) => (
    <CWCollapsible
      headerContent={<CWText>{args.headerContent}</CWText>}
      collapsibleContent={<CWText>{args.collapsibleContent}</CWText>}
    />
  )
}
