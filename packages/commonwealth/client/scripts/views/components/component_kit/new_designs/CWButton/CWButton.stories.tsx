// Replace your-renderer with the renderer you are using (e.g., react, vue3, etc.)
import type { Meta, StoryObj } from '@storybook/react';

import { CWButton } from './CWButton';

const meta: Meta<typeof CWButton> = {
  component: CWButton,
};
export default meta;

type Story = StoryObj<typeof CWButton>;

export const Basic: Story = {};

export const Primary: Story = {
  args: {},
};
