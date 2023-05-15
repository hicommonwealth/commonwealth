import React, { FC } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import {
  CWCard,
  CardElevation,
} from '../../../client/scripts/views/components/component_kit/cw_card';
import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';
import { notifySuccess } from '../../../client/scripts/controllers/app/notifications';

import '../../../client/styles/components/component_kit/cw_component_showcase.scss';

const card = {
  title: 'Organisms/Card',
  component: CWCard,
} satisfies Meta<typeof CWCard>;

export default card;
// type Story = StoryObj<typeof card>;

interface CardProps {
  elevation: CardElevation | undefined;
  interactive?: boolean;
  fullWidth?: boolean;
  children: any;
}

const Card: FC<CardProps> = (props) => {
  const { elevation, interactive = false, fullWidth } = props;
  console.log('interactive:', interactive);
  return (
    <CWCard
      elevation={elevation}
      interactive={interactive}
      fullWidth={fullWidth}
      onClick={() => notifySuccess('Card clicked!')}
    >
      {props.children}
    </CWCard>
  );
};

// export const Elevation1: Story = {
export const Elevation1 = {
  name: 'Elevation 1',
  render: () => (
    <Card elevation="elevation-1" interactive>
      <CWText fontWeight="semiBold">Card title</CWText>
      <CWText>Elevation: 1</CWText>
    </Card>
  ),
};

// export const Elevation2: Story = {
export const Elevation2 = {
  name: 'Elevation 2',
  render: () => (
    <Card elevation="elevation-2" interactive>
      <CWText fontWeight="semiBold">Card title</CWText>
      <CWText>Elevation: 2</CWText>
    </Card>
  ),
};

// export const Elevation3: Story = {
export const Elevation3 = {
  name: 'Elevation 3',
  render: () => (
    <Card elevation="elevation-3" interactive>
      <CWText fontWeight="semiBold">Card title</CWText>
      <CWText>Elevation: 3</CWText>
    </Card>
  ),
};

// export const Elevation3: Story = {
export const FullWidth = {
  name: 'Full width',
  render: () => (
    <Card elevation="elevation-3" interactive fullWidth>
      <CWText fontWeight="semiBold">Card title</CWText>
      <CWText>Full width</CWText>
    </Card>
  ),
};
