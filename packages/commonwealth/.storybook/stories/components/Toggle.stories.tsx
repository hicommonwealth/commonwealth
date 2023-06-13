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

// TODO change name
export const Overview: Story = {
  args: {
    checked: false,
    disabled: false,
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
      exclude: [ "className", "onChange", ],
    },
  },
  render: ({...args}) => <Toggle {...args} />,
};
