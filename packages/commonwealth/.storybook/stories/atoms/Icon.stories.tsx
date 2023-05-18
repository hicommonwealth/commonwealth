import React, { FC, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWIcon } from '../../../client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from '../../../client/scripts/views/components/component_kit/cw_icon_button';
import { iconLookup } from '../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';
import { IconComponentProps } from '../../../client/scripts/views/components/component_kit/cw_icons/types';

const iconOptions = [ ...Object.keys(iconLookup) ];

const icons = {
  title: 'Atoms/Icon',
  component: CWIcon,
} satisfies Meta<typeof CWIcon>;

export default icons;
type Story = StoryObj<typeof icons>;

const IconButton: FC<IconComponentProps> = (props) => {
  const { selected = false } = props;
  const [isSelected, setIsSelected] = useState<boolean>(selected);

  return (
    <CWIconButton
      {...props}
      selected={isSelected}
      onClick={() => setIsSelected(isSelected => !isSelected)}
    />
  );
};

const commonArgTypes = {
  argTypes: {
    iconName: {
      control: { type: "select" },
      options: iconOptions,
    },
    iconSize: {
      control: { type: "select" },
      options: ["xxs", "xs", "small", "medium", "large", "xl", "xxl"],
    },
  },
};

const commonExcludedControls = [
  "argTypes",
  "className",
  "componentType",
  "onClick",
];

export const IconStory: Story = {
  name: "Overview",
  args: {
    iconName: "arrowLeft",
    iconSize: "medium",
    disabled: false,
  },
  argTypes: {
    ...commonArgTypes,
    disabled: {
      options: [ true, false ],
    },
  },
  parameters: {
    controls: {
      exclude: [
        ...commonExcludedControls,
        "iconButtonTheme",
        "selected",
      ],
    },
  },
  render: ({...args}) => <CWIcon {...args} />
}

export const IconButtonStory: Story = {
  name: "Icon Button",
  args: {
    iconName: "arrowLeft",
    iconSize: "medium",
    iconButtonTheme: undefined,
    disabled: false,
    selected: false,
  },
  argTypes: {
    ...commonArgTypes,
    iconButtonTheme: {
      control: { type: "radio" },
      options: ["black", "neutral", "primary", "hasBackground"],
    },
    disabled: {
      options: [ true, false ],
    },
    selected: {
      options: [ true, false ],
    },
    // TODO handle selected
  },
  parameters: {
    controls: {
      exclude: [ ...commonExcludedControls ],
    },
  },
  render: ({...args}) => <IconButton {...args} />
}
