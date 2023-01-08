/* @jsx m */

import ClassComponent from 'class_component';
import { ChainBase } from 'common-common/src/types';

import 'components/tx_signing/tx_signing_cli_option.scss';
import { ISubstrateTXData } from 'controllers/chain/substrate/shared';
import m from 'mithril';
import { ITXModalData } from 'models';

import app from 'state';
import { CodeBlock } from 'views/components/code_block';
import { CWButton } from '../component_kit/cw_button';
import { CWTextArea } from '../component_kit/cw_text_area';
import { setupEventListeners } from './helpers';
import { NextFn } from './types';

type TXSigningCLIOptionAttrs = ITXModalData & NextFn;

export class TXSigningCLIOption extends ClassComponent<TXSigningCLIOptionAttrs> {
  private calldata?: ISubstrateTXData;
  private signedTx: string;

  async oncreate(vnode: m.Vnode<TXSigningCLIOptionAttrs>) {
    if (this.calldata === undefined) {
      this.calldata =
        (await vnode.attrs.txData.unsignedData()) as ISubstrateTXData;
      m.redraw();
    }
  }

  view(vnode: m.Vnode<TXSigningCLIOptionAttrs>) {
    const transact = (...args) => {
      setupEventListeners(vnode);
      vnode.attrs.txData.transact(...args);
    };

    return (
      <div class="TXSigningCLIOption">
        {this.calldata &&
        app.chain &&
        app.chain.base === ChainBase.Substrate ? (
          <>
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
              <span class="no-select">secret phrase</span>
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
              onclick={(e) => {
                e.preventDefault();
                try {
                  transact(this.signedTx.trim());
                } catch (err) {
                  throw new Error('Failed to execute signed transaction');
                }
              }}
              label="Send transaction"
            />
          </>
        ) : (
          <CodeBlock clickToSelect>Loading transaction data...</CodeBlock>
        )}
      </div>
    );
  }
}
