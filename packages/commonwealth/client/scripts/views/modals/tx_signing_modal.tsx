/* @jsx m */

import $ from 'jquery';
import m from 'mithril';

import 'modals/tx_signing_modal.scss';

import app from 'state';
import { ITXModalData } from 'models';
import PolkadotWebWalletController from 'controllers/app/webWallets/polkadot_web_wallet';
import { ModalExitButton } from 'views/components/component_kit/cw_modal';
import { TXSigningTransactionBox } from '../components/tx_signing/tx_signing_transaction_box';
import {
  getModalTitle,
  getTransactionLabel,
} from '../components/tx_signing/helpers';
import { StageName, TxDataState } from '../components/tx_signing/types';
import {
  TxSigningModalIntroStage,
  TxSigningModalWaitingStage,
} from '../components/tx_signing/tx_signing_modal_stages';
import { CWButton } from '../components/component_kit/cw_button';

class TXSigningModal implements m.ClassComponent<ITXModalData> {
  private data: TxDataState;
  private stageName: StageName;

  oninit() {
    this.stageName = 'intro';
  }

  view(vnode) {
    const { author, next, txData, txType } = vnode.attrs;

    const txLabel = getTransactionLabel(txType);

    const polkaWallet = app.wallets.wallets.find(
      (w) => w instanceof PolkadotWebWalletController
    );

    return (
      <div class="TXSigningModal">
        {/*
          // pass transaction signing state down to each step's view
          stageName: this.stageName,
          stateData: this.data,
          // handle state transitions
          next: (newState, newData) => {
            this.stageName = newState;
            this.data = newData;
            m.redraw();
          },
        })} */}
        <div class="compact-modal-title">
          <h3>{getModalTitle(this.stageName, txLabel)}</h3>
          <ModalExitButton />
        </div>
        <div class="compact-modal-body">
          {this.stageName === 'intro' && (
            <TxSigningModalIntroStage
              author={author}
              next={next}
              polkaWallet={polkaWallet}
              txData={txData}
              txType={txType}
            />
          )}
          {this.stageName === 'waiting' && <TxSigningModalWaitingStage />}
          {this.stageName === 'success' && (
            <>
              <TXSigningTransactionBox
                success
                status="Success"
                blockHash={vnode.attrs.stateData.hash}
                blockNum={vnode.attrs.stateData.blocknum || '--'}
                timestamp={
                  vnode.attrs.stateData.timestamp?.format
                    ? `${vnode.attrs.stateData.timestamp.format()}`
                    : '--'
                }
              />
              <CWButton
                oncreate={(vvnode) => $(vvnode.dom).focus()}
                onclick={(e) => {
                  e.preventDefault();
                  $(vnode.dom).trigger('modalexit');
                }}
                label="Done"
              />
            </>
          )}
          {this.stageName === 'rejected' && (
            <>
              <TXSigningTransactionBox
                success={false}
                status={vnode.attrs.stateData.error.toString()}
                blockHash={
                  vnode.attrs.stateData.hash
                    ? `${vnode.attrs.stateData.hash}`
                    : '--'
                }
                blockNum={
                  vnode.attrs.stateData.blocknum
                    ? `${vnode.attrs.stateData.blocknum}`
                    : '--'
                }
                timestamp={
                  vnode.attrs.stateData.timestamp
                    ? `${vnode.attrs.stateData.timestamp.format()}`
                    : '--'
                }
              />
              <CWButton
                onclick={(e) => {
                  e.preventDefault();
                  $(vnode.dom).trigger('modalexit');
                }}
                label="Done"
              />
              <CWButton
                oncreate={(vvnode) => $(vvnode.dom).focus()}
                onclick={() => {
                  vnode.attrs.next('Intro');
                }}
                label="Try again"
              />
            </>
          )}
        </div>
      </div>
    );
  }
}

export const createTXModal = async (
  dataP: ITXModalData | Promise<ITXModalData>
) => {
  const data = await Promise.resolve(dataP);

  if (data) {
    const modalP = new Promise((resolve, reject) => {
      let complete = false;

      app.modals.create({
        modal: TXSigningModal,
        completeCallback: () => {
          complete = true;
        },
        exitCallback: () => {
          if (data.cb) {
            data.cb(complete);
          }
          return complete ? resolve(data) : reject(data);
        },
        data,
      });

      m.redraw();
    });

    return modalP;
  }
};
