import React, { FC } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWCard, CardElevation } from '../../../client/scripts/views/components/component_kit/cw_card';
import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';
import { notifySuccess } from '../../../client/scripts/controllers/app/notifications';

import '../../../client/styles/components/component_kit/cw_component_showcase.scss';

const card = {
  title: 'Organisms/Card',
  component: CWCard,
} satisfies Meta<typeof CWCard>;

export default card;
type Story = StoryObj<any>;

interface CardProps {
  elevation: CardElevation | undefined,
  interactive?: boolean,
  fullWidth?: boolean,
  children: any,
}

const Card: FC<CardProps> = (props) => {
  const { elevation, interactive = false, fullWidth } = props;
  return (
    <CWCard
      elevation={elevation}
      interactive={interactive}
      fullWidth={fullWidth}
      onClick={() => notifySuccess('Card clicked!')}
    >
      {props.children}
    </CWCard>
  )
}

export const CardStory: Story = {
  name: "Card",
  args: {
    elevation: "elevation-1",
    fullWidth: false,
    interactive: false,
    title: "Card title",
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras magna.",
  },
  argTypes: {
    elevation: {
      control: { type: "select" },
      options: [ "elevation-1", "elevation-2", "elevation-3" ],
    },
    fullWidth: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
    interactive: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
    title: {
      control: { type: "text" }
    },
    content: {
      control: { type: "text" }
    },
  },
  render: ({...args}) => (
    <Card elevation={args.elevation} {...args}>
      <CWText fontWeight="semiBold">{args.title}</CWText>
      <CWText>{args.content}</CWText>
    </Card>
  )
}
