/* @jsx m */

import m from 'mithril';

import 'components/tx_signing/tx_signing_transaction_box.scss';

import { getClasses } from '../component_kit/helpers';

type TXSigningTransactionBoxAttrs = {
  blockHash: string;
  blockNum: string;
  status: string;
  success: boolean;
  timestamp: string;
};

export class TXSigningTransactionBox
  implements m.ClassComponent<TXSigningTransactionBoxAttrs>
{
  view(vnode) {
    return (
      <div class="TXSigningTransactionBox">
        <div class="txbox-header">Status</div>
        <div
          class={getClasses<{ success?: boolean }>(
            { success: vnode.attrs.success },
            'txbox-content'
          )}
        >
          {vnode.attrs.status}
        </div>
        <div class="txbox-header">Block Hash</div>
        <div class="txbox-content">{vnode.attrs.blockHash}</div>
        <div class="txbox-header">Block Number</div>
        <div class="txbox-content">{vnode.attrs.blockNum}</div>
        <div class="txbox-header">Timestamp</div>
        <div class="txbox-content">{vnode.attrs.timestamp}</div>
      </div>
    );
  }
}
