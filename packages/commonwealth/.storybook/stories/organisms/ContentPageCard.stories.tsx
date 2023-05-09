import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWContentPageCard } from '../../../client/scripts/views/components/component_kit/cw_content_page';
import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';

const contentPageCard = {
  title: 'Organisms/Content Page Card',
  component: CWContentPageCard,
} satisfies Meta<typeof CWContentPageCard>;

export default contentPageCard;
// type Story = StoryObj<typeof contentPageCard>;

// export const ContentPageCard: Story = {
export const ContentPageCard = {
  name: 'Content Page Card',
  render: () => (
    <CWContentPageCard
      header="Information"
      content={
        <div style={{ padding: '16px' }}>
          <CWText>Content page card content</CWText>
        </div>
      }
    />
  )
}
