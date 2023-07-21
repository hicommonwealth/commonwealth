import React, { FC } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWButton } from '../../../client/scripts/views/components/component_kit/new_designs/cw_button';
import { CWTooltip } from "../../../client/scripts/views/components/component_kit/new_designs/cw_tooltip";

const tooltip = {
  title: "Components/Tooltip",
  component: CWTooltip,
} satisfies Meta<typeof CWTooltip>;

export default tooltip;

type TooltipProps = {
  content: string;
};

const Tooltip: FC<TooltipProps> = ({ content }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '800px',
        height: '300px',
      }}
    >
      <CWTooltip content={content} placement="top" renderTrigger={(handleInteraction) => (
        <CWButton
          label="top"
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
        />
      )} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          width: '50%',
        }}
      >
        <div
          style={{
            width: '50%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CWTooltip content={content} placement="left" renderTrigger={(handleInteraction) => (
            <CWButton
              label="left"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )} />
        </div>
        <div
          style={{
            width: '50%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CWTooltip content={content} placement="right" renderTrigger={(handleInteraction) => (
            <CWButton
              label="right"
              onMouseEnter={handleInteraction}
              onMouseLeave={handleInteraction}
            />
          )} />
        </div>
      </div>
      <CWTooltip content={content} placement="bottom" renderTrigger={(handleInteraction) => (
        <CWButton
          label="bottom"
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
        />
      )} />
    </div>
  );
};

export const Overview = {
  name: "Tooltip",
  args: {
    content: "A tooltip is a non-actionable label for explaining a UI element or feature.",
  },
  argTypes: {
    content: {
      control: { type: "text" },
    },
  },
  parameters: {
    controls: { exclude: [ "placement", "hasBackground", "renderTrigger" ] },
  },
  render: ({...args}) => (
    <Tooltip content={args.content} />
  ),
};
