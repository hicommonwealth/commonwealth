/* @jsx m */

import ClassComponent from 'class_component';

import 'components/component_kit/cw_popover/cw_address_tooltip.scss';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import m from 'mithril';
import { CWIconButton } from '../cw_icon_button';
import { CWText } from '../cw_text';
import { ComponentType } from '../types';
import { CWTooltip } from './cw_tooltip';

type AddressTooltipAttrs = {
  address: string;
  trigger: m.Vnode;
};

export class CWAddressTooltip extends ClassComponent<AddressTooltipAttrs> {
  view(vnode: m.Vnode<AddressTooltipAttrs>) {
    const { address, trigger } = vnode.attrs;

    return (
      <CWTooltip
        persistOnHover
        interactionType="hover"
        tooltipContent={
          <div class={ComponentType.AddressTooltip}>
            <CWText type="caption">{address}</CWText>
            <CWIconButton
              iconName="copy"
              iconSize="small"
              iconButtonTheme="primary"
              onclick={async () => {
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
        hoverCloseDelay={100}
      />
    );
  }
}
