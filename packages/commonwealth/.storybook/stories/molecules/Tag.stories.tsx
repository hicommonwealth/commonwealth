import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWTag } from '../../../client/scripts/views/components/component_kit/cw_tag';

const tag = {
  title: 'Molecules/Tag',
  component: CWTag,
} satisfies Meta<typeof CWTag>;

export default tag;
// type Story = StoryObj<typeof tag>;

// export const Regular: Story = {
export const Regular = {
  name: 'Regular',
  render: () => <CWTag label="Ref #90" />,
};

// export const Passed: Story = {
export const Passed = {
  name: 'Passed',
  render: () => <CWTag label="Passed" type="passed" />,
};

// export const Failed: Story = {
export const Failed = {
  name: 'Failed',
  render: () => <CWTag label="Failed" type="failed" />,
};

// export const Active: Story = {
export const Active = {
  name: 'Active',
  render: () => <CWTag label="Active" type="active" />,
};

// export const Poll: Story = {
export const Poll = {
  name: 'Poll',
  render: () => <CWTag label="Poll" type="poll" />,
};

// export const Proposal: Story = {
export const Proposal = {
  name: 'Proposal',
  render: () => <CWTag label="Prop #52" type="proposal" />,
};

// export const Referendum: Story = {
export const Referendum = {
  name: 'Referendum',
  render: () => <CWTag label="Ref #90" type="referendum" />,
};

// export const Referendum: Story = {
export const WithIcon = {
  name: 'With Icon',
  render: () => <CWTag label="12 days" iconName="clock" />,
};
