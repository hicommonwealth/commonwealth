import React, { FC } from 'react';
import type { Meta } from '@storybook/react';

import { CWTooltip } from '../../../client/scripts/views/components/component_kit/cw_popover/cw_tooltip';
import { CWAddressTooltip } from '../../../client/scripts/views/components/component_kit/cw_popover/cw_address_tooltip';
import { CWIcon } from '../../../client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from '../../../client/scripts/views/components/component_kit/cw_icon_button';
import { iconLookup, IconName } from '../../../client/scripts/views/components/component_kit/cw_icons/cw_icon_lookup';

import '../../../client/styles/components/component_kit/cw_component_showcase.scss';

const iconOptions = [ ...Object.keys(iconLookup) ];

const tooltip = {
  title: 'Molecules/Tooltip',
  component: CWTooltip,
} satisfies Meta<typeof CWTooltip>;

export default tooltip;

type InteractionType = (e: any) => void;

interface TooltipProps {
  content: string | React.ReactNode;
  iconName: IconName;
  hasBackground?: boolean;
}

const Tooltip: FC<TooltipProps> = (props) => {
  const { content, iconName, hasBackground } = props;

  return (
    <CWTooltip
      content={content}
      hasBackground={hasBackground}
      renderTrigger={(handleInteraction) => (
        <CWIcon
          iconName={iconName}
          onMouseEnter={handleInteraction}
          onMouseLeave={handleInteraction}
        />
      )}
    />
  );
}

export const Overview = {
  args: {
    content: `
      I am an informational tool tip here to provide \
      extra details on things people may need more help on.
    `,
    iconName: "infoEmpty",
    hasBackground: false,
  },
  argTypes: {
    content: {
      control: { type: "text" },
    },
    iconName: {
      control: { type: "select" },
      options: iconOptions,
    },
    hasBackground: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
  },
  parameters: {
    controls: { exclude: ["renderTrigger"], }
  },
  render: ({...args}) => (
    <Tooltip
      content={args.content}
      iconName={args.iconName}
      hasBackground={args.hasBackground}
    />
  ),
}

export const AddressTooltip = {
  args: {
    address: "0xa5430730f12f1128bf10dfba38c8e00bc4d90eea",
    iconName: "infoEmpty",
  },
  argTypes: {
    address: {
      control: { type: "text" },
    },
    iconName: {
      control: { type: "select" },
      options: iconOptions,
    },
  },
  parameters: {
    controls: { exclude: ["content", "renderTrigger"], }
  },
  render: ({...args}) => (
    <div className="tooltip-row">
      <CWAddressTooltip
        address={args.address}
        renderTrigger={(handleInteraction: InteractionType) => (
          <CWIconButton
            iconName={args.iconName}
            onClick={handleInteraction}
          />
        )}
      />
    </div>
  )
}
