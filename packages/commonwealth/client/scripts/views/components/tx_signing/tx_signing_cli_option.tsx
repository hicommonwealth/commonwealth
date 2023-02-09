import React from 'react';

import { ChainBase } from 'common-common/src/types';
import type { ResultNode } from 'mithrilInterop';
import { ClassComponent, redraw } from 'mithrilInterop';

import 'components/tx_signing/tx_signing_cli_option.scss';
import type { ISubstrateTXData } from 'controllers/chain/substrate/shared';
import type { ITXModalData } from 'models';

import app from 'state';
import { CodeBlock } from 'views/components/code_block';
import { CWButton } from '../component_kit/cw_button';
import { CWTextArea } from '../component_kit/cw_text_area';
import { setupEventListeners } from './helpers';
import type { NextFn } from './types';

type TXSigningCLIOptionAttrs = ITXModalData & NextFn;

export class TXSigningCLIOption extends ClassComponent<TXSigningCLIOptionAttrs> {
  private calldata?: ISubstrateTXData;
  private signedTx: string;

  async oncreate(vnode: ResultNode<TXSigningCLIOptionAttrs>) {
    if (this.calldata === undefined) {
      this.calldata =
        (await vnode.attrs.txData.unsignedData()) as ISubstrateTXData;
      redraw();
    }
  }

  view(vnode: ResultNode<TXSigningCLIOptionAttrs>) {
    const transact = (...args) => {
      setupEventListeners(vnode);
      vnode.attrs.txData.transact(...args);
    };

    return (
      <div className="TXSigningCLIOption">
        {this.calldata &&
        app.chain &&
        app.chain.base === ChainBase.Substrate ? (
          <React.Fragment>
            <CodeBlock clickToSelect>
              {`subkey ${
                this.calldata.isEd25519 ? '-e ' : ''
              }sign-transaction \\
          --call ${this.calldata.call.slice(2)} \\
          --nonce ${this.calldata.nonce} \\
          --prior-block-hash ${this.calldata.blockHash.slice(
            2
          )} \\ --password "" \\
          --suri "`}
              <span className="no-select">secret phrase</span>
              {`"`}
            </CodeBlock>
            <CWTextArea
              label="Enter the output here"
              placeholder="Signed TX"
              value={this.signedTx}
              onInput={(e) => {
                this.signedTx = e.target.value;
              }}
            />
            <CWButton
              onClick={(e) => {
                e.preventDefault();
                try {
                  transact(this.signedTx.trim());
                } catch (err) {
                  throw new Error('Failed to execute signed transaction');
                }
              }}
              label="Send transaction"
            />
          </React.Fragment>
        ) : (
          <CodeBlock clickToSelect>Loading transaction data...</CodeBlock>
        )}
      </div>
    );
  }
}
