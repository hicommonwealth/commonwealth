/* @jsx m */

import m from 'mithril';

import 'components/component_kit/cw_address_tooltip.scss';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { CWTooltip } from './cw_tooltip';
import { ComponentType } from './types';
import { CWText } from './cw_text';
import { CWIconButton } from './cw_icon_button';

export class CWAddressTooltip implements m.ClassComponent<{ address: string }> {
  view(vnode) {
    const { address, trigger } = vnode.attrs;

    return (
      <CWTooltip
        persistOnHover
        interactionType="hover"
        tooltipContents={
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
      />
    );
  }
}
