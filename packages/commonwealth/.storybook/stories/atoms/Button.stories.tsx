import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWButton } from '../../../client/scripts/views/components/component_kit/cw_button';
import { notifySuccess } from '../../../client/scripts/controllers/app/notifications';

const button = {
  title: 'Atoms/Button',
  component: CWButton,
} satisfies Meta<typeof CWButton>;

export default button;
type Story = StoryObj<typeof CWButton>;

/** Primary buttons */
export const PrimaryRed: Story = {
  name: 'Primary red with icon',
  render: () => (
    <CWButton
      iconLeft="person"
      buttonType="primary-red"
      label="Primary red with icon"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const PrimaryBlue: Story = {
  name: 'Primary blue with icon',
  render: () => (
    <CWButton
      buttonType="primary-blue"
      label="Primary blue"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const PrimaryBlack: Story = {
  name: 'Primary black',
  render: () => (
    <CWButton
      buttonType="primary-black"
      label="Primary black"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const PrimaryDisabled: Story = {
  name: 'Primary disabled',
  render: () => (
    <CWButton
      label="Primary disabled"
      disabled
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Secondary buttons */
export const SecondaryRed: Story = {
  name: 'Secondary red with icon',
  render: () => (
    <CWButton
      iconLeft="person"
      label="Secondary red with icon"
      buttonType="secondary-red"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const SecondaryBlue: Story = {
  name: 'Secondary blue',
  render: () => (
    <CWButton
      label="Secondary blue"
      buttonType="secondary-blue"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const SecondaryBlack: Story = {
  name: 'Secondary black',
  render: () => (
    <CWButton
      label="Secondary black"
      buttonType="secondary-black"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const SecondaryDisabled: Story = {
  name: 'Secondary disabled',
  render: () => (
    <CWButton
      label="Secondary disabled"
      buttonType="secondary-blue"
      disabled
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Tertiary buttons */
export const TertiaryBlue: Story = {
  name: 'Tertiary blue with icon',
  render: () => (
    <CWButton
      iconLeft="person"
      label="Tertiary blue with icon"
      buttonType="tertiary-blue"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const TertiaryBlack: Story = {
  name: 'Tertiary black',
  render: () => (
    <CWButton
      label="Tertiary black"
      buttonType="tertiary-black"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const TertiaryDisabled: Story = {
  name: 'Tertiary disabled',
  render: () => (
    <CWButton
      label="Tertiary disabled"
      buttonType="tertiary-black"
      disabled
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Large primary buttons */
export const LargePrimaryRed: Story = {
  name: 'Large primary red with icon',
  render: () => (
    <CWButton
      iconLeft="person"
      label="Large primary red with icon"
      buttonType="lg-primary-red"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const LargePrimaryBlue: Story = {
  name: 'Large primary blue',
  render: () => (
    <CWButton
      label="Large primary blue"
      buttonType="lg-primary-blue"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const LargePrimaryBlueDisabled: Story = {
  name: 'Large primary blue disabled',
  render: () => (
    <CWButton
      label="Large primary blue"
      buttonType="lg-primary-blue"
      disabled
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Large secondary buttons */
export const LargeSecondaryRed: Story = {
  name: 'Large secondary red with icon',
  render: () => (
    <CWButton
      iconLeft="person"
      label="Large secondary red with icon"
      buttonType="lg-secondary-red"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const LargeSecondaryBlue: Story = {
  name: 'Large secondary blue',
  render: () => (
    <CWButton
      label="Large secondary blue"
      buttonType="lg-secondary-blue"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const LargeSecondaryBlueDisabled: Story = {
  name: 'Large secondary blue disabled',
  render: () => (
    <CWButton
      label="Large secondary disabled"
      buttonType="lg-secondary-blue"
      disabled
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Large tertiary buttons */
export const LargeTertiaryRed: Story = {
  name: 'Large tertiary red with icon',
  render: () => (
    <CWButton
      iconLeft="person"
      label="Large tertiary red with icon"
      buttonType="lg-tertiary-red"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const LargeTertiaryBlue: Story = {
  name: 'Large tertiary blue',
  render: () => (
    <CWButton
      label="Large tertiary blue"
      buttonType="lg-tertiary-blue"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const LargeTertiaryBlueDisabled: Story = {
  name: 'Large tertiary blue disabled',
  render: () => (
    <CWButton
      label="Large tertiary disabled"
      buttonType="lg-tertiary-blue"
      disabled
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Blue dark disabled buttons */
export const PrimaryBlueDarkDisabled: Story = {
  name: 'Primary blue dark disabled',
  render: () => (
    <CWButton
      label="Primary blue dark disabled"
      buttonType="primary-blue-dark"
      disabled
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const SecondaryBlueDarkDisabled: Story = {
  name: 'Secondary blue dark disabled',
  render: () => (
    <CWButton
      label="Secondary blue dark disabled"
      buttonType="secondary-blue-dark"
      disabled
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Mini buttons */
export const MiniWithIcon: Story = {
  name: 'Mini with icon',
  render: () => (
    <CWButton
      iconLeft="person"
      buttonType="mini-black"
      label="Mini with icon"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const Mini: Story = {
  name: 'Mini',
  render: () => (
    <CWButton
      label="Mini"
      buttonType="mini-black"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const MiniDisabled: Story = {
  name: 'Mini disabled',
  render: () => (
    <CWButton
      label="Mini Disabled"
      buttonType="mini-black"
      disabled
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Mini white buttons */
export const MiniWhiteWithIcon: Story = {
  name: 'Mini white with icon',
  render: () => (
    <CWButton
      iconLeft="person"
      buttonType="mini-white"
      label="Mini white with icons"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const MiniWhite: Story = {
  name: 'Mini',
  render: () => (
    <CWButton
      label="Mini white"
      buttonType="mini-white"
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

export const MiniWhiteDisabled: Story = {
  name: 'Mini disabled',
  render: () => (
    <CWButton
      label="Mini white disabled"
      buttonType="mini-white"
      disabled
      onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};
