import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWTextInput } from '../../../client/scripts/views/components/component_kit/cw_text_input';
import type { ValidationStatus } from '../../../client/scripts/views/components/component_kit/cw_validation_text';

const input = {
  title: 'Molecules/TextInput',
  component: CWTextInput,
} satisfies Meta<typeof CWTextInput>;

export default input;
type Story = StoryObj<typeof input>;

/** Large */
export const Large: Story = {
  render: () => (
    <CWTextInput name="Text field" label="Large" placeholder="Type here" />
  ),
};

/** Small */
export const Small: Story = {
  render: () => (
    <CWTextInput
      name="Text field"
      label="Small"
      placeholder="Type here"
      size="small"
    />
  ),
};

/** This input only accepts A-Z */
export const OnlyLetters: Story = {
  render: () => (
    <CWTextInput
      name="Form field"
      inputValidationFn={(val: string): [ValidationStatus, string] => {
        if (val.match(/[^A-Za-z]/)) {
          return ['failure', 'Must enter characters A-Z'];
        } else {
          return ['success', 'Input validated'];
        }
      }}
      label="This input only accepts A-Z"
      placeholder="Type here"
    />
  ),
};

/** Text field with icons */
export const WithIcons: Story = {
  render: () => (
    <CWTextInput
      label="Text field with icons"
      name="Text field with icons"
      placeholder="Type here"
      iconRight="write"
    />
  ),
};

/** Disabled */
export const Disabled: Story = {
  render: () => (
    <CWTextInput
      name="Text field"
      label="Disabled"
      disabled
      value="Some disabled text"
    />
  ),
};

/** Dark mode */
export const DarkMode: Story = {
  render: () => (
    <CWTextInput
      name="Text field dark mode"
      label="Dark mode"
      darkMode
      placeholder="Type here"
    />
  ),
};
