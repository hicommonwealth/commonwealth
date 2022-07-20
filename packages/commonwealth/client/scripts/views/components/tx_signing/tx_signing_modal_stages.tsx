/* @jsx m */

import m from 'mithril';
import { Spinner } from 'construct-ui';

import app from 'state';
import { ITXModalData, IWebWallet } from 'models';
import { CWTabBar, CWTab } from '../component_kit/cw_tabs';
import { TXSigningCLIOption } from './tx_signing_cli_option';
import { TXSigningWebWalletOption } from './tx_signing_web_wallet_option';
import { NextFn } from './types';

export class TxSigningModalIntroStage
  implements m.ClassComponent<ITXModalData & NextFn & IWebWallet<any>>
{
  private introTab: 'webWallet' | 'commandLine';

  oninit() {
    this.introTab = 'webWallet';
  }

  view(vnode) {
    const { author, next, polkaWallet, txData, txType } = vnode.attrs;

    return (
      <>
        <CWTabBar>
          <CWTab
            label="Web wallet"
            isSelected={this.introTab === 'webWallet'}
            onclick={() => {
              this.introTab = 'webWallet';
            }}
          />
          <CWTab
            label="Command line"
            isSelected={this.introTab === 'commandLine'}
            onclick={() => {
              this.introTab = 'commandLine';
            }}
          />
        </CWTabBar>
        {this.introTab === 'webWallet' && (
          <TXSigningWebWalletOption
            txData={txData}
            txType={txType}
            author={author}
            next={next}
            wallet={polkaWallet}
          />
        )}
        {this.introTab === 'commandLine' && (
          <TXSigningCLIOption
            txData={txData}
            txType={txType}
            author={author}
            next={next}
          />
        )}
      </>
    );
  }
}

export class TxSigningModalWaitingStage implements m.ClassComponent {
  private timeoutHandle?: NodeJS.Timeout;
  private timer?: number;
  private timerHandle?: NodeJS.Timeout;

  oncreate(vnode) {
    const $parent = $('.TXSigningModal');

    this.timer = 0;

    // TODO: set a timeout? We currently have no failure case due to how event handling works.
    this.timerHandle = global.setInterval(() => {
      this.timer++;
      m.redraw();
    }, 1000);

    // for edgeware mainnet, timeout after 10 sec
    // TODO: remove this after the runtime upgrade to Substrate 2.0 rc3+
    if (app.chain?.meta?.id === 'edgeware') {
      this.timeoutHandle = global.setTimeout(() => {
        clearInterval(this.timeoutHandle);
        vnode.attrs.next('SentTransactionSuccess', {
          hash: 'Not available',
        });
        $parent.trigger('modalcomplete');
      }, 10000);
    }
  }

  onremove() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
    }
  }

  view() {
    return (
      <>
        <div class="TXSigningBodyText">
          Waiting for your transaction to be confirmed by the network...
        </div>
        <Spinner active />
        <div>`Waiting ${this.timer || 0}s...</div>
      </>
    );
  }
}
