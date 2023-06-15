import React from 'react';
import type { Meta } from "@storybook/react";

import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';

const text = {
  title: 'Foundations/Typography',
  component: CWText,
} satisfies Meta<typeof CWText>;

export default text;

const options = {
  "Display": {
    type: [ "d1", "d2", ],
    fontWeight: [ "medium", "semiBold", "bold" ],
  },
  "Heading": {
    type: [ "h1", "h2", "h3", "h4", "h5" ],
    fontWeight: [ "medium", "semiBold", "bold" ],
  },
  "Body": {
    type: [ "b1", "b2", ],
    fontWeight: [ "regular", "medium", "bold", "italic", "link" ],
  },
  "Caption": {
    type: [ "caption" ],
    fontWeight: [ "regular", "medium", "uppercase" ],
  },
  "Button": {
    type: [ "buttonLg", "buttonSm" ],
    fontWeight: [ "medium" ],
  },
  "Monospace": {
    type: [ "monospace1", "monospace2" ],
    fontWeight: [ "regular", "medium" ],
  },
};

const BaseStory = (type: string) => {
  return {
    args: {
      text: "Commonwealth",
      type: options[type].type[0],
      fontWeight: options[type].fontWeight[0],
      isCentered: false,
      disabled: false,
    },
    argTypes: {
      disabled: {
        options: [ true, false ],
      },
      fontWeight: {
        control: { type: "inline-radio" },
        options: options[type].fontWeight,
      },
      isCentered: {
        options: [ true, false ],
      },
      type: {
        control: { type: "inline-radio" },
        options: options[type].type,
      },
    },
    parameters: {
      controls: {
        exclude: [ "className", "noWrap", "truncate", "fontStyle" ],
      },
    },
    render: ({...args}) => (
      <CWText {...args}>
        {args.text}
      </CWText>
    ),
  };
};

export const Display = { ...BaseStory("Display") };
export const Heading = { ...BaseStory("Heading") };
export const Body = { ...BaseStory("Body") };
export const Caption = { ...BaseStory("Caption") };
export const Button = { ...BaseStory("Button") };
export const Monospace = { ...BaseStory("Monospace") };
