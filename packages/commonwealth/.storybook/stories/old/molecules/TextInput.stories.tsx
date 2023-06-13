import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWTextInput } from '../../../../client/scripts/views/components/component_kit/cw_text_input';
import type { ValidationStatus } from '../../../../client/scripts/views/components/component_kit/cw_validation_text';
import { iconLookup } from '../../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';

const iconOptions = [ undefined, ...Object.keys(iconLookup) ];

const commonControlsToExclude = [
  "autoComplete",
  "containerClassName",
  "defaultValue",
  "autoFocus",
  "value",
  "iconRightonClick",
  "maxLength",
  "name",
  "onClick",
  "onInput",
  "onenterkey",
  "tabIndex",
  "inputClassName",
  "displayOnly",
  "hasRightIcon",
  "isTyping",
];

const input = {
  title: 'Old/Molecules/TextInput',
  component: CWTextInput,
} satisfies Meta<typeof CWTextInput>;

export default input;
type Story = StoryObj<typeof input>;

export const TextInput: Story = {
  args: {
    label: "Large",
    placeholder: "Type here",
    disabled: false,
    size: "large",
    iconRight: undefined,
    darkMode: false,
  },
  argTypes: {
    label: {
      control: { type: "text" },
    },
    placeholder: {
      control: { type: "text" },
    },
    disabled: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
    size: {
      control: { type: "select" },
      options: [ "small", "large" ],
    },
    iconRight: {
      control: { type: "select" },
      options: iconOptions,
    },
    darkMode: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
  },
  parameters: {
    controls: {
      exclude: [
        ...commonControlsToExclude,
        "autoFocus",
        "inputValidationFn",
        "manualStatusMessage",
        "manualValidationStatus",
        "validationStatus",
      ],
    }
  },
  render: ({...args}) => (
    <CWTextInput name="Text field" {...args} />
  )
};

/** This input only accepts A-Z */
export const OnlyLetters = {
  args: {
    label: "This input only accepts A-Z",
    placeholder: "Type here",
    disabled: false,
    size: "large",
    iconRight: undefined,
    darkMode: false,
    validationFailText: "Must enter characters A-Z",
    validationSuccessText: "Input validated",
  },
  argTypes: {
    label: {
      control: { type: "text" },
    },
    placeholder: {
      control: { type: "text" },
    },
    disabled: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
    size: {
      control: { type: "select" },
      options: [ "small", "large" ],
    },
    iconRight: {
      control: { type: "select" },
      options: iconOptions,
    },
    darkMode: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
    validationFailText: {
      control: { type: "text" },
    },
    validationSuccessText: {
      control: { type: "text" },
    }
  },
  parameters: {
    controls: {
      exclude: [ ...commonControlsToExclude ],
    }
  },
  render: ({...args}) => (
    <CWTextInput
      {...args}
      name="Form field"
      inputValidationFn={(val: string): [ValidationStatus, string] => {
        if (val.match(/[^A-Za-z]/)) {
          return ['failure', args.validationFailText];
        } else {
          return ['success', args.validationSuccessText];
        }
      }}
      label={args.label}
      placeholder={args.placeholder}
    />
  ),
};
