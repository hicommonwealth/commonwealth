/* @jsx jsx */
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  jsx,
} from 'mithrilInterop';

import 'components/component_kit/cw_popover/cw_address_tooltip.scss';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import m from 'mithril';
import { CWIconButton } from '../cw_icon_button';
import { CWText } from '../cw_text';
import { ComponentType } from '../types';
import { CWTooltip } from './cw_tooltip';

type AddressTooltipAttrs = {
  address: string;
  trigger: ResultNode;
};

export class CWAddressTooltip extends ClassComponent<AddressTooltipAttrs> {
  view(vnode: ResultNode<AddressTooltipAttrs>) {
    const { address, trigger } = vnode.attrs;

    return (
      <CWTooltip
        persistOnHover
        interactionType="hover"
        tooltipContent={
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
                  })
                  .catch(() => notifyError('Failed to copy address'));
              }}
            />
          </div>
        }
        tooltipType="singleLine"
        trigger={trigger}
      />
    );
  }
}
