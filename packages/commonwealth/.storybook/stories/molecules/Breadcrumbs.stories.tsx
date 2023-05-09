import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWBreadcrumbs } from '../../../client/scripts/views/components/component_kit/cw_breadcrumbs';

const breadcrumbs = {
  title: 'Molecules/Breadcrumbs',
  component: CWBreadcrumbs,
} satisfies Meta<typeof CWBreadcrumbs>;

export default breadcrumbs;
// type Story = StoryObj<typeof breadcrumbs>;

// export const Breadcrumbs: Story = {
export const Breadcrumbs = {
  render: () => (
    <CWBreadcrumbs
      breadcrumbs={[
        { label: 'Page' },
        { label: 'Page' },
        { label: 'Page' },
        { label: 'Current' },
      ]}
    />
  )
}
