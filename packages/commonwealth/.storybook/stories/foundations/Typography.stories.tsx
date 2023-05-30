import React from 'react';
import type { Meta } from "@storybook/react";

import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';

const text = {
  title: 'Foundations/Typography',
  component: CWText,
} satisfies Meta<typeof CWText>;

export default text;

export const Typography = {
  args: {
    text: "Display1 semi bold",
    type: "d1",
    fontWeight: "semiBold",
    fontStyle: undefined,
    isCentered: false,
    disabled: false,
  },
  argTypes: {
    disabled: {
      options: [ true, false ],
    },
    fontStyle: {
      control: { type: "inline-radio" },
      options: [ undefined, 'italic', 'uppercase' ],
    },
    fontWeight: {
      control: { type: "inline-radio" },
      options: [ "regular", "medium", "semiBold", "bold", "black", "italic", "uppercase" ],
    },
    isCentered: {
      options: [ true, false ],
    },
    type: {
      control: { type: "inline-radio" },
      options: [ "d1", "d2", "h1", "h2", "h3", "h4", "h5", "b1", "b2", "caption", "buttonSm", "buttonLg", "buttonMini" ],
    },
  },
  parameters: {
    controls: {
      exclude: [ "className", "noWrap", "truncate" ],
    },
  },
  render: ({...args}) => (
    <CWText {...args}>
      {args.text}
    </CWText>
  ),
};
