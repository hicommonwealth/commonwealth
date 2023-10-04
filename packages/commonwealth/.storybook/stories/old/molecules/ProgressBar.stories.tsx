import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWProgressBar } from '../../../../client/scripts/views/components/component_kit/cw_progress_bar';

import '../../../../client/styles/components/component_kit/cw_component_showcase.scss';

const progressBar = {
  title: 'Old/Molecules/ProgressBar',
  component: CWProgressBar,
} satisfies Meta<typeof CWProgressBar>;

export default progressBar;
type Story = StoryObj<typeof progressBar>;

export const ProgressBar: Story = {
  args: {
    progress: 75,
		label: "Progress Bar",
		progressStatus: "selected",
		iconName: "check",
		subtext: "",
  },
  argTypes: {
    progress: {
      control: {
        type: "range",
        min: 1,
        max: 100,
        step: 1,
      },
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
      if: {
        arg: "progress",
        eq: 100,
      }
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
