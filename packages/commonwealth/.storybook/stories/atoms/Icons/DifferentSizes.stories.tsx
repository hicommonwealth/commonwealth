import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWIcon } from '../../../../client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../../../client/scripts/views/components/component_kit/cw_text';
// import '../../../client/styles/components/component_kit/cw_component_showcase.scss';

const icons = {
  title: 'Atoms/Icons with different sizes',
  component: CWIcon,
} satisfies Meta<typeof CWIcon>;

export default icons;
// type Story = StoryObj<typeof allIcons>;

const IconSize = (props) => {
  return (
    <div className="icon-row">
      {props.children}
    </div>
  );
}

// export const Small: Story = {
export const Small = {
  name: 'Small',
  render: () => {
    return (
      <IconSize>
        <CWText>Small</CWText>
        <CWIcon iconName="views" iconSize="small" />
      </IconSize>
    )
  }
}

// export const Medium: Story = {
export const Medium = {
  name: 'Medium',
  render: () => {
    return (
      <IconSize>
        <CWText>Medium</CWText>
        <CWIcon iconName="views" />
      </IconSize>
    )
  }
}

// export const Large: Story = {
export const Large = {
  name: 'Medium',
  render: () => {
    return (
      <IconSize>
        <CWText>Large</CWText>
        <CWIcon iconName="views" iconSize="large" />
      </IconSize>
    )
  }
}

// export const Large: Story = {
export const DisabledLarge = {
  name: 'Disabled Large',
  render: () => {
    return (
      <IconSize>
        <CWText>Disabled Large</CWText>
        <CWIcon iconName="views" iconSize="large" disabled />
      </IconSize>
    )
  }
}
