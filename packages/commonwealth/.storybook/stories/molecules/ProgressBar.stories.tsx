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

// export const ProgressBarSuccess: Story = {
export const ProgressBarSuccess = {
  name: 'Progress Bar (Success)',
  render: () => (
    <div className="progress-gallery">
      <CWProgressBar
        progress={75}
        label="Progress Bar (Success)"
        progressStatus="passed"
      />
    </div>
  )
}

export const ProgressBarSuccessWithCheck = {
  name: 'Progress Bar (Success) with Check',
  render: () => (
    <div className="progress-gallery">
      <CWProgressBar
        progress={75}
        label="Progress Bar (Success) with Check"
        progressStatus="passed"
        iconName="check"
      />
    </div>
  )
}

export const ProgressBarSelected = {
  name: 'Progress Bar (Selected)',
  render: () => (
    <div className="progress-gallery">
      <CWProgressBar
        progress={100}
        label="Progress Bar (Selected)"
        progressStatus="selected"
      />
    </div>
  )
}

export const ProgressBarNeutralWithToken = {
  name: 'Progress Bar (Neutral) With Token',
  render: () => (
    <div className="progress-gallery">
      <CWProgressBar
        progress={150}
        label="Progress Bar (Neutral) With Token"
        progressStatus="neutral"
        subtext={`${Math.min(100, Math.floor(50 * 1000) / 1000)} CMN`}
      />
    </div>
  )
}

export const ProgressBarOngoingWithToken = {
  name: 'Progress Bar (Ongoing) With Token',
  render: () => (
    <div className="progress-gallery">
      <CWProgressBar
        progress={75}
        label="Progress Bar (Ongoing) With Token"
        progressStatus="ongoing"
        subtext={`${Math.min(100, Math.floor(50 * 1000) / 1000)} CMN`}
      />
    </div>
  )
}
