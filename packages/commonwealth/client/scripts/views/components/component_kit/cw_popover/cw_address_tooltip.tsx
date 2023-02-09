import React from 'react';

import 'components/component_kit/cw_popover/cw_address_tooltip.scss';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import m from 'mithril';
import { CWIconButton } from '../cw_icon_button';
import { CWText } from '../cw_text';
import { ComponentType } from '../types';
import { Popover, usePopover } from './cw_popover';
import type { PopoverTriggerProps } from './cw_popover';

type AddressTooltipProps = {
  address: string;
} & PopoverTriggerProps;

export const CWAddressTooltip = (props: AddressTooltipProps) => {
  const { address, renderTrigger } = props;

  const popoverProps = usePopover();

  return (
    <>
      {renderTrigger(popoverProps.handleInteraction)}
      <Popover
        placement="top-start"
        content={
          <div className={ComponentType.AddressTooltip}>
            <CWText type="caption">{address}</CWText>
            <CWIconButton
              iconName="copy"
              iconSize="small"
              iconButtonTheme="primary"
              onClick={async () => {
                navigator.clipboard
                  .writeText(address)
                  .then(() => {
                    notifySuccess('Address copied to clipboard');
                    popoverProps.setAnchorEl(null);
                  })
                  .catch(() => notifyError('Failed to copy address'));
              }}
            />
          </div>
        }
        {...popoverProps}
      />
    </>
  );
};
