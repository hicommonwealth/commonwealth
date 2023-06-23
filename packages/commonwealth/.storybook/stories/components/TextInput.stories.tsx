import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWTextInput } from '../../../client/scripts/views/components/component_kit/cw_text_input';
import type { ValidationStatus } from '../../../client/scripts/views/components/component_kit/cw_validation_text';
import { iconLookup } from '../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';

const iconOptions = [ undefined, ...Object.keys(iconLookup) ];

const input = {
  title: 'Components/TextInput',
  component: CWTextInput,
} satisfies Meta<typeof CWTextInput>;

export default input;
type Story = StoryObj<typeof input>;

export const TextInput: Story = {
  args: {
    placeholder: "Placeholder",
    disabled: false,
    isCompact: true,
    iconLeft: undefined,
    iconRight: undefined,
  },
  argTypes: {
    placeholder: {
      control: { type: "text" },
    },
    disabled: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
    isCompact: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
    iconLeft: {
      control: { type: "select" },
      options: iconOptions,
    },
    iconRight: {
      control: { type: "select" },
      options: iconOptions,
    },
  },
  parameters: {
    controls: {
      exclude: [
        "autoComplete",
        "containerClassName",
        "darkMode",
        "defaultValue",
        "autoFocus",
        "value",
        "iconLeftonClick",
        "iconRightonClick",
        "label",
        "maxLength",
        "name",
        "onClick",
        "onInput",
        "onenterkey",
        "tabIndex",
        "inputClassName",
        "displayOnly",
        "hasLeftIcon",
        "hasRightIcon",
        "isTyping",
        "autoFocus",
        "inputValidationFn",
        "manualStatusMessage",
        "manualValidationStatus",
        "validationStatus",
        "size",
      ],
    }
  },
  render: ({...args}) => (
    <CWTextInput name="Text field" {...args} />
  )
};
