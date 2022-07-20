/* @jsx m */

import $ from 'jquery';
import m from 'mithril';

import 'components/tx_signing/tx_signing_cli_option.scss';

import app from 'state';
import { ChainBase } from 'common-common/src/types';
import { ITXModalData, ITXData } from 'models';
import { ISubstrateTXData } from 'controllers/chain/substrate/shared';
import { CodeBlock } from 'views/components/code_block';
import { NextFn } from './types';
import { setupEventListeners } from './helpers';
import { CWValidationText } from '../component_kit/cw_validation_text';
import { CWButton } from '../component_kit/cw_button';
import { CWTextArea } from '../component_kit/cw_text_area';

type TXSigningCLIOptionAttrs = ITXModalData & { next: NextFn };

export class TXSigningCLIOption
  implements m.ClassComponent<TXSigningCLIOptionAttrs>
{
  private calldata?: ITXData;
  private error?: string;

  async oncreate(vnode) {
    if (this.calldata === undefined) {
      this.calldata = await vnode.attrs.txData.unsignedData();
      m.redraw();
    }
  }

  view(vnode) {
    const transact = (...args) => {
      setupEventListeners(vnode);
      vnode.attrs.txData.transact(...args);
    };

    let signBlock = (
      <CodeBlock clickToSelect>Loading transaction data...</CodeBlock>
    );

    let instructions;

    let submitAction;

    if (this.calldata && app.chain && app.chain.base === ChainBase.Substrate) {
      const calldata = this.calldata as ISubstrateTXData;

      instructions = (
        <div class="instructions">Use subkey to sign this transaction:</div>
      );

      signBlock = (
        <CodeBlock clickToSelect>
          {`subkey ${calldata.isEd25519 ? '-e ' : ''}sign-transaction \\
          --call ${calldata.call.slice(2)} \\
          --nonce ${calldata.nonce} \\
          --prior-block-hash ${calldata.blockHash.slice(2)} \\ --password "" \\
          --suri "`}
          <span class="no-select">secret phrase</span>
          {`"`}
        </CodeBlock>
      );

      submitAction = (
        <CWButton
          onclick={(e) => {
            e.preventDefault();
            try {
              const signedTx = $(vnode.dom)
                .find('TextArea')
                .val()
                .toString()
                .trim();
              transact(signedTx);
            } catch (err) {
              throw new Error('Failed to execute signed transaction');
            }
          }}
          label="Send transaction"
        />
      );
    }

    return (
      <div class="TXSigningCLIOption">
        {instructions}
        {signBlock}
        <p>Enter the output here:</p>
        <CWTextArea placeholder="Signed TX" />
        {this.error && (
          <CWValidationText message={this.error} status="failure" />
        )}
        {submitAction}
        {!submitAction && (
          <p class="transaction-loading">Still loading transaction...</p>
        )}
      </div>
    );
  }
}
