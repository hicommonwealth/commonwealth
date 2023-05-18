import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWProgressBar } from '../../../client/scripts/views/components/component_kit/cw_progress_bar';

import '../../../client/styles/components/component_kit/cw_component_showcase.scss';

const progressBar = {
  title: 'Molecules/ProgressBar',
  component: CWProgressBar,
} satisfies Meta<typeof CWProgressBar>;

export default progressBar;
type Story = StoryObj<typeof progressBar>;

export const ProgressBar: Story = {
  args: {
    progress: 75,
		label: "Progress Bar",
		progressStatus: "selected",
		iconName: undefined,
		subtext: undefined,
  },
  argTypes: {
    progress: {
      control: { type: "number" },
    },
		label: {
      control: { type: "text" },
    },
		progressStatus: {
      control: { type: "select" },
      options: [ "selected", "neutral", "ongoing", "passed" ],
    },
		iconName: {
      control: { type: "select" },
      options: [ undefined, "check" ],
    },
		subtext: {
      control: { type: "text" },
    },
  },
  render: ({...args}) => (
    <CWProgressBar
      progress={args.progress}
      label={args.label}
      progressStatus={args.progressStatus}
      iconName={args.iconName}
      subtext={args.subtext}
    />
  ),
}
