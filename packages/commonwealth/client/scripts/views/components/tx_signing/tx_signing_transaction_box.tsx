/* @jsx jsx */
import React from 'react';

import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/tx_signing/tx_signing_transaction_box.scss';
import { CWText } from '../component_kit/cw_text';

import { getClasses } from '../component_kit/helpers';

type TXSigningTransactionBoxAttrs = {
  blockHash: string;
  blockNum: string | number;
  status: string;
  success: boolean;
  timestamp: string;
};

export class TXSigningTransactionBox extends ClassComponent<TXSigningTransactionBoxAttrs> {
  view(vnode: ResultNode<TXSigningTransactionBoxAttrs>) {
    const { blockHash, blockNum, status, success, timestamp } = vnode.attrs;

    return (
      <div className="TXSigningTransactionBox">
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
