import React, { FC, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWToggle } from '../../../client/scripts/views/components/component_kit/cw_toggle';
import type { ToggleStyleProps } from '../../../client/scripts/views/components/component_kit/cw_toggle';

const toggle = {
  title: 'Components/Toggle',
  component: CWToggle,
} satisfies Meta<typeof CWToggle>;

export default toggle;
type Story = StoryObj<typeof toggle>;

const Toggle: FC<ToggleStyleProps> = (props) => {
  const { checked, disabled } = props;
  const [isChecked, setIsChecked] = useState<boolean | undefined>(checked);

  useEffect(() => setIsChecked(checked), [checked]);

  return (
    <CWToggle
      checked={isChecked}
      disabled={disabled}
      onChange={(e) => {
        setIsChecked(!isChecked)
        e.stopPropagation();
      }}
    />
  );
}

const Base = (checked: boolean, disabled: boolean) => {
  return {
    args: {
      checked: checked,
      disabled: disabled,
    },
    argTypes: {
      checked: {
        control: { type: "boolean" },
        options: [ true, false ],
      },
      disabled: {
        control: { type: "boolean" },
        options: [ true, false ],
      },
    },
    parameters: {
      controls: {
        exclude: [
          "className",
          "onChange",
          disabled ? "checked" : null,
          "disabled",
        ],
      },
    },
    render: ({...args}) => <Toggle {...args} />,
  };
}

export const Overview: Story = { ...Base(false, false) };
export const DisabledUnchecked: Story = { ...Base(false, true) };
export const DisabledChecked: Story = { ...Base(true, true) };;
