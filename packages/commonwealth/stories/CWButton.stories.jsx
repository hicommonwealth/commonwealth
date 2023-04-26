// import { CWButton } from '../client/scripts/views/components/component_kit/cw_button';
// import { CWButton } from './CWButton';

// export default {
//   title: 'Example/CWButton',
//   component: CWButton,
// };

// export const Primary = {
//   args: {
//     label: 'Sample',
//   },
// };

import React from "react";
// import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "./CWButton";
// import { notifySuccess } from 'controllers/app/notifications';

const button = {
  title: "Example/CWButton",
  component: Button,
// } satisfies Meta<typeof Button>;
};

export default button;
// type Story = StoryObj<typeof button>;

/** Primary buttons */
// export const PrimaryRed: Story = {
export const PrimaryRed = {
  name: "Primary red with icon",
  render: () => (
    <Button
      primary
      iconLeft="person"
      buttonType="primary-red"
      label="Primary red with icon"
      backgroundColor="red"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const PrimaryBlue: Story = {
export const PrimaryBlue = {
  name: "Primary blue with icon",
  render: () => (
    <Button
      primary
      buttonType="primary-blue"
      label="Primary blue"
      backgroundColor="blue"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const PrimaryBlack: Story = {
export const PrimaryBlack = {
  name: "Primary black",
  render: () => (
    <Button
      primary
      buttonType="primary-black"
      label="Primary black"
      backgroundColor="black"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const PrimaryDisabled: Story = {
export const PrimaryDisabled = {
  name: "Primary disabled",
  render: () => (
    <Button
      primary
      label="Primary disabled"
      backgroundColor="black"
      size="medium"
      disabled
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Secondary buttons */
// export const SecondaryRed: Story = {
export const SecondaryRed = {
  name: "Secondary red with icon",
  render: () => (
    <Button
      primary={false}
      iconLeft="person"
      label="Secondary red with icon"
      buttonType="secondary-red"
      backgroundColor="white"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const SecondaryBlue: Story = {
export const SecondaryBlue = {
  name: "Secondary blue",
  render: () => (
    <Button
      primary={false}
      label="Secondary blue"
      buttonType="secondary-blue"
      backgroundColor="white"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const SecondaryBlack: Story = {
export const SecondaryBlack = {
  name: "Secondary black",
  render: () => (
    <Button
      primary={false}
      label="Secondary black"
      buttonType="secondary-black"
      backgroundColor="white"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const SecondaryDisabled: Story = {
export const SecondaryDisabled = {
  name: "Secondary disabled",
  render: () => (
    <Button
      primary={false}
      label="Secondary disabled"
      buttonType="secondary-blue"
      disabled
      backgroundColor="white"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Tertiary buttons */
// export const TertiaryBlue: Story = {
export const TertiaryBlue = {
  name: "Tertiary blue with icon",
  render: () => (
    <Button
      primary
      iconLeft="person"
      label="Tertiary blue with icon"
      buttonType="tertiary-blue"
      backgroundColor="black"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const TertiaryBlack: Story = {
export const TertiaryBlack = {
  name: "Tertiary black",
  render: () => (
    <Button
      primary
      label="Tertiary black"
      buttonType="tertiary-black"
      backgroundColor="black"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const TertiaryDisabled: Story = {
export const TertiaryDisabled = {
  name: "Tertiary disabled",
  render: () => (
    <Button
      primary
      label="Tertiary disabled"
      buttonType="tertiary-black"
      disabled
      backgroundColor="gray"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Large primary buttons */
// export const LargePrimaryRed: Story = {
export const LargePrimaryRed = {
  name: "Large primary red with icon",
  render: () => (
    <Button
      primary
      iconLeft="person"
      label="Large primary red with icon"
      buttonType="lg-primary-red"
      backgroundColor="red"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const LargePrimaryBlue: Story = {
export const LargePrimaryBlue = {
  name: "Large primary blue",
  render: () => (
    <Button
      primary
      iconLeft="person"
      label="Large primary blue"
      buttonType="lg-primary-blue"
      backgroundColor="blue"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const LargePrimaryBlueDisabled: Story = {
export const LargePrimaryBlueDisabled = {
  name: "Large primary blue disabled",
  render: () => (
    <Button
      primary
      iconLeft="person"
      label="Large primary blue"
      buttonType="lg-primary-blue"
      disabled
      backgroundColor="gray"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Large secondary buttons */
// export const LargeSecondaryRed: Story = {
export const LargeSecondaryRed = {
  name: "Large secondary red with icon",
  render: () => (
    <Button
      primary={false}
      iconLeft="person"
      label="Large secondary red with icon"
      buttonType="lg-secondary-red"
      backgroundColor="red"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const LargeSecondaryBlue: Story = {
export const LargeSecondaryBlue = {
  name: "Large secondary blue",
  render: () => (
    <Button
      primary={false}
      iconLeft="person"
      label="Large secondary blue"
      buttonType="lg-secondary-blue"
      backgroundColor="blue"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const LargeSecondaryBlueDisabled: Story = {
export const LargeSecondaryBlueDisabled = {
  name: "Large secondary blue disabled",
  render: () => (
    <Button
      primary={false}
      iconLeft="person"
      label="Large secondary disabled"
      buttonType="lg-secondary-blue"
      disabled
      backgroundColor="gray"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Large tertiary buttons */
// export const LargeTertiaryRed: Story = {
export const LargeTertiaryRed = {
  name: "Large tertiary red with icon",
  render: () => (
    <Button
      primary
      iconLeft="person"
      label="Large tertiary red with icon"
      buttonType="lg-tertiary-red"
      backgroundColor="red"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const LargeTertiaryBlue: Story = {
export const LargeTertiaryBlue = {
  name: "Large tertiary blue",
  render: () => (
    <Button
      primary
      iconLeft="person"
      label="Large tertiary blue"
      buttonType="lg-tertiary-blue"
      backgroundColor="blue"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const LargeTertiaryBlueDisabled: Story = {
export const LargeTertiaryBlueDisabled = {
  name: "Large tertiary blue disabled",
  render: () => (
    <Button
      primary
      iconLeft="person"
      label="Large tertiary disabled"
      buttonType="lg-tertiary-blue"
      disabled
      backgroundColor="gray"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Blue dark disabled buttons */
// export const PrimaryBlueDarkDisabled: Story = {
export const PrimaryBlueDarkDisabled = {
  name: "Primary blue dark disabled",
  render: () => (
    <Button
      primary
      label="Primary blue dark disabled"
      buttonType="primary-blue-dark"
      backgroundColor="gray"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const SecondaryBlueDarkDisabled: Story = {
export const SecondaryBlueDarkDisabled = {
  name: "Secondary blue dark disabled",
  render: () => (
    <Button
      primary={false}
      label="Secondary blue dark disabled"
      buttonType="secondary-blue-dark"
      backgroundColor="gray"
      size="medium"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Mini buttons */
// export const MiniWithIcon: Story = {
export const MiniWithIcon = {
  name: "Mini with icon",
  render: () => (
    <Button
      primary
      label="Mini with icon"
      buttonType="mini-black"
      backgroundColor="black"
      size="small"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const Mini: Story = {
export const Mini = {
  name: "Mini",
  render: () => (
    <Button
      primary
      label="Mini"
      buttonType="mini-black"
      backgroundColor="black"
      size="small"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const MiniDisabled: Story = {
export const MiniDisabled = {
  name: "Mini disabled",
  render: () => (
    <Button
      primary
      label="Mini Disabled"
      buttonType="mini-black"
      disabled
      backgroundColor="gray"
      size="small"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

/** Mini white buttons */
// export const MiniWhiteWithIcon: Story = {
export const MiniWhiteWithIcon = {
  name: "Mini white with icon",
  render: () => (
    <Button
      primary={false}
      iconLeft="person"
      buttonType="mini-white"
      label="Mini white with icon"
      backgroundColor="white"
      size="small"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const MiniWhite: Story = {
export const MiniWhite = {
  name: "Mini",
  render: () => (
    <Button
      primary={false}
      label="Mini white"
      buttonType="mini-white"
      backgroundColor="white"
      size="small"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};

// export const MiniWhiteDisabled: Story = {
export const MiniWhiteDisabled = {
  name: "Mini disabled",
  render: () => (
    <Button
      primary={false}
      label="Mini white disabled"
      buttonType="mini-white"
      disabled
      backgroundColor="white"
      size="small"
      // onClick={() => notifySuccess('Button clicked!')}
    />
  ),
};
