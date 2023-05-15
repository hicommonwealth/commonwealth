import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWTextArea } from '../../../client/scripts/views/components/component_kit/cw_text_area';

const textarea = {
  title: 'Molecules/Textarea',
  component: CWTextArea,
} satisfies Meta<typeof CWTextArea>;

export default textarea;
type Story = StoryObj<typeof textarea>;

export const Textarea: Story = {
  render: () => (
    <CWTextArea name="Textarea" label="Text area" placeholder="Type here" />
  ),
};
