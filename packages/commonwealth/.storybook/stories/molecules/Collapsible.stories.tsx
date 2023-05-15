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
  name: 'Collapsible',
  render: () => (
    <CWCollapsible
      headerContent={<CWText>Header content</CWText>}
      collapsibleContent={<CWText>Body content</CWText>}
    />
  ),
};
