/* @jsx m */

import m from 'mithril';

import 'components/tx_signing/tx_signing_transaction_box.scss';

import { getClasses } from '../component_kit/helpers';
import { CWText } from '../component_kit/cw_text';

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
    const { blockHash, blockNum, status, success, timestamp } = vnode.attrs;

    return (
      <div class="TXSigningTransactionBox">
        <CWText fontWeight="medium">Status</CWText>
        <CWText
          className={getClasses<{ success?: boolean }>(
            { success },
            'status-text'
          )}
        >
          {status}
        </CWText>
        <CWText fontWeight="medium">Block Hash</CWText>
        <CWText>{blockHash}</CWText>
        <CWText fontWeight="medium">Block Number</CWText>
        <CWText>{blockNum}</CWText>
        <CWText fontWeight="medium">Timestamp</CWText>
        <CWText>{timestamp}</CWText>
      </div>
    );
  }
}
