import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';

import '../../../client/styles/components/component_kit/cw_component_showcase.scss';

const text = {
  title: 'Atoms/Text',
  component: CWText,
} satisfies Meta<typeof CWText>;

export default text;
type Story = StoryObj<typeof text>;

export const Text: Story = {
  name: 'Overview',
  args: {
    children: "Display1 semi bold",
    fontWeight: "semiBold",
    fontStyle: undefined,
    type: "d1",
    disabled: false,
    isCentered: false,
    noWrap: false,
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
    noWrap: {
      options: [ true, false ],
    },
    type: {
      control: { type: "inline-radio" },
      options: [ "d1", "d2", "h1", "h2", "h3", "h4", "h5", "b1", "b2", "caption", "buttonSm", "buttonLg", "buttonMini" ],
    },
  },
  parameters: {
    controls: {
      exclude: [ "className", "truncate", ],
    },
  },
  render: ({...args}) => (
    <CWText {...args}>
      {args.children}
    </CWText>
  ),
};

// parent must be flex container and have definite width for this to work
export const Body1NoWrap: Story = {
  name: 'Body1 noWrap',
  render: () => (
    <div className="text-row">
      <CWText type="h3">Overflow</CWText>
      <div className="ellipsis-row">
        <CWText type="h3" noWrap>
          Body1 noWrap
        </CWText>
      </div>
    </div>
  ),
};
