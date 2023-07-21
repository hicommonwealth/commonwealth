import React, { FC, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWToggle } from '../../../client/scripts/views/components/component_kit/new_designs/cw_toggle';
import type { ToggleProps } from '../../../client/scripts/views/components/component_kit/new_designs/cw_toggle';

const toggle = {
  title: 'Components/Toggle',
  component: CWToggle,
} satisfies Meta<typeof CWToggle>;

export default toggle;

const Toggle: FC<ToggleProps> = (props) => {
  const { checked, disabled, size } = props;
  const [isChecked, setIsChecked] = useState<boolean | undefined>(checked);

  useEffect(() => setIsChecked(checked), [checked]);

  return (
    <CWToggle
      checked={isChecked}
      disabled={disabled}
      size={size}
      onChange={(e) => {
        setIsChecked(!isChecked)
        e.stopPropagation();
      }}
    />
  );
}

const Base = (size: string, checked: boolean, disabled: boolean) => {
  return {
    args: {
      checked: checked,
      disabled: disabled,
      size: size,
    },
    argTypes: {
      checked: {
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
          "size",
        ],
      },
    },
    render: ({...args}) => (
      <Toggle
        checked={args.checked}
        disabled={args.disabled}
        size={args.size}
      />
    ),
  };
}

export const Small = { ...Base("small", false, false) };
export const SmallDisabledUnchecked = { ...Base("small", false, true) };
export const SmallDisabledChecked = { ...Base("small", true, true) };;
export const Large = { ...Base("large", false, false) };
export const LargeDisabledUnchecked = { ...Base("large", false, true) };
export const LargeDisabledChecked = { ...Base("large", true, true) };;
