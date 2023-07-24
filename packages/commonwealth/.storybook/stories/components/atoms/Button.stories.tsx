import React from 'react';
import type { Meta } from "@storybook/react";

import { ButtonType, CWButton } from '../../../../client/scripts/views/components/component_kit/new_designs/cw_button';
import { notifySuccess } from '../../../../client/scripts/controllers/app/notifications';
import { iconLookup } from '../../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';

const iconOptions = [ undefined, ...Object.keys(iconLookup) ];

const button = {
  title: 'Components/Atoms/Button',
  component: CWButton,
} satisfies Meta<typeof CWButton>;

export default button;

const argTypesObj = () => {
  return {
    buttonType: {
      control: { type: "inline-radio" },
      options: ["primary", "secondary", "tertiary", "destructive"]
    },
    iconLeft: {
      control: { type: "select" },
      options: iconOptions,
    },
    iconRight: {
      control: { type: "select" },
      options: iconOptions,
    },
    label: {
      control: { type: "text" },
    },
    buttonHeight: {
      control: { type: "inline-radio" },
      options: ['lg', 'med', 'sm']
    },
    buttonWidth: {
      control: { type: "inline-radio" },
      options: ["narrow", "wide", "full"]
    },
    disabled: {
      options: [ true, false ],
    },
  }
}

const commonParameters = {
  parameters: {
    controls: { exclude: ["className", "buttonType"] },
  },
};

const BaseStory = (buttonType: ButtonType) => {
  const type: string = String(buttonType);

  return {
    args: {
      label: type[0].toUpperCase().concat(type.slice(1)),
      iconLeft: "person",
      iconRight: undefined,
      buttonType: buttonType,
      buttonWidth: "narrow",
      buttonHeight: "med",
      disabled: false,
    },
    argTypes: argTypesObj(),
    ...commonParameters,
    render: ({...args}) => (
      <CWButton label={args.label} {...args} onClick={() => notifySuccess('Button clicked!')} />
    ),
  };
}

export const Primary = { ...BaseStory("primary") };
export const Secondary = { ...BaseStory("secondary") };
export const Tertiary = { ...BaseStory("tertiary") };
export const Destructive = { ...BaseStory("destructive") };
