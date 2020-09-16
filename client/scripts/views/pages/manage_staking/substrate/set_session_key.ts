import $ from 'jquery';
import m from 'mithril';
import app from 'state';
import { makeDynamicComponent } from 'models/mithril';
import Substrate from 'controllers/chain/substrate/main';
import SessionKey from 'views/pages/manage_staking/substrate/session_key';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import StashController from 'views/pages/manage_staking/substrate/stash_controller';
import { AddressInfo } from 'models';
import { openTXModal } from './new_nominator';

interface NewSessionKeyState { dynamic: {} }

interface NewSessionKeyAttrs {
  controllerId: string;
  stashId: string;
}

interface IModel {
  controller: AddressInfo;
  error: boolean,
  txSuccess: boolean,
  bond(): void,
  txCallback(success: boolean): void
  key: { value: string, valid: boolean },
  onKeyChange(key: string, valid?: boolean): void,
}

const model: IModel = {
  txSuccess: false,
  error: true,
  controller: null,
  key: {
    value: null,
    valid: false
  },
  onKeyChange: (key: string, valid?: boolean) => {
    model.key = { value: key, valid };
  },
  bond: () => {
    const sessionTx = (app.chain as Substrate).chain.getTxMethod('session', 'setKeys')(
      model.key.value as any, new Uint8Array()
    );
    const txFunc = (model.controller as any as SubstrateAccount).batchTx([sessionTx]);
    txFunc.cb = model.txCallback;
    openTXModal(txFunc);
  },
  txCallback: (success) => {
    model.txSuccess = success;
  }
};

const NewSessionKey = makeDynamicComponent<NewSessionKeyAttrs, NewSessionKeyState>({
  oncreate: (vnode) => {
    model.error = true;
    model.controller = app.chain.accounts.get(vnode.attrs.controllerId);
  },
  getObservables: () => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    const { controllerId, stashId } = vnode.attrs;

    return m('.NewSessionKey.manage-staking', [
      m('.compact-modal-title.center-lg', [
        m('h3', [ 'Set Session Key' ]),
      ]),
      m('.compact-modal-body',
        m('span', [
          m(StashController, { controllerId, stashId }),
          m(SessionKey, {
            onChange: model.onKeyChange
          }),
          m('div.center-lg.padding-t-10', [
            !model.txSuccess
            && m('button.cui-button.cui-align-center.cui-primary', {
              disabled: !model.key.valid,
              onclick: model.bond,
            }, 'Set Session Key'),
            model.txSuccess
            && m('button.cui-button.cui-align-center.cui-default', {
              onclick: (e) => {
                e.preventDefault();
                $(vnode.dom).trigger('modalexit');
              },
            }, 'Close')
          ])
        ]))
    ]);
  },
});

export default NewSessionKey;
