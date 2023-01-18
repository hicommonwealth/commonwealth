/* @jsx jsx */
import React from 'react';


import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

import 'components/tx_signing/tx_signing_cli_option.scss';

import app from 'state';
import { ChainBase } from 'common-common/src/types';
import { ITXModalData } from 'models';
import { ISubstrateTXData } from 'controllers/chain/substrate/shared';
import { CodeBlock } from 'views/components/code_block';
import { NextFn } from './types';
import { setupEventListeners } from './helpers';
import { CWButton } from '../component_kit/cw_button';
import { CWTextArea } from '../component_kit/cw_text_area';

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
              oninput={(e) => {
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
