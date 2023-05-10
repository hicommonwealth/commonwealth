import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWTooltip } from '../../../client/scripts/views/components/component_kit/cw_popover/cw_tooltip';
import { CWAddressTooltip } from '../../../client/scripts/views/components/component_kit/cw_popover/cw_address_tooltip';
import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';
import { CWIcon } from '../../../client/scripts/views/components/component_kit/cw_icons/cw_icon';
import { CWIconButton } from '../../../client/scripts/views/components/component_kit/cw_icon_button';

import '../../../client/styles/components/component_kit/cw_component_showcase.scss';

const tooltip = {
  title: 'Molecules/Tooltip',
  component: CWTooltip,
} satisfies Meta<typeof CWTooltip>;

export default tooltip;
// type Story = StoryObj<typeof tooltip>;

type InteractionType = (e: any) => void;

// export const Default: Story = {
export const Default = {
  name: 'Default',
  render: () => (
    <div className="tooltip-row">
      <CWText>Default</CWText>
      <CWTooltip
        content={`
            I am an informational tool tip here to provide \
            extra details on things people may need more help on.
          `}
        renderTrigger={(handleInteraction) => (
          <CWIcon
            iconName="infoEmpty"
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          />
        )}
      />
    </div>
  )
}

// export const SolidBackground: Story = {
export const SolidBackground = {
  name: 'Solid background',
  render: () => (
    <div className="tooltip-row">
      <CWText>Solid background</CWText>
      <CWTooltip
        content={`
            I am an informational tool tip here to provide \
            extra details on things people may need more help on.
          `}
        hasBackground
        renderTrigger={(handleInteraction) => (
          <CWIcon
            iconName="infoEmpty"
            onMouseEnter={handleInteraction}
            onMouseLeave={handleInteraction}
          />
        )}
      />
    </div>
  )
}

// export const SolidBackground: Story = {
export const AddressTooltip = {
  name: 'Address tooltip',
  render: () => (
    <div className="tooltip-row">
      <CWText>Address tooltip</CWText>
      <CWAddressTooltip
        address="0xa5430730f12f1128bf10dfba38c8e00bc4d90eea"
        renderTrigger={(handleInteraction: InteractionType) => (
          <CWIconButton
            iconName="infoEmpty"
            onClick={handleInteraction}
          />
        )}
      />
    </div>
  )
}
