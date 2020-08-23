import $ from 'jquery';
import BN from 'bn.js';
import m from 'mithril';
import app from 'state';
import { AddressInfo } from 'models';
import { makeDynamicComponent } from 'models/mithril';
import Substrate from 'controllers/chain/substrate/main';
import Nominate from 'views/pages/manage_staking/substrate/nominate';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import StashController from 'views/pages/manage_staking/substrate/stash_controller';
import { openTXModal } from './new_nominator';

interface SetNominatorsState { dynamic: {} }

interface SetNominatorsAttrs {
  controllerId: string;
  stashId: string;
}

interface IModel {
  stash: AddressInfo;
  txSuccess: boolean,
  bond(): void,
  txCallback(success: boolean): void
  nominates: string[],
  onNominateChange(selected: string[]): void
}

const model: IModel = {
  txSuccess: false,
  stash: null,
  nominates: [],
  onNominateChange: (selected: string[]) => {
    model.nominates = selected;
  },
  bond: () => {
    const nominateTx = (app.chain as Substrate).chain.getTxMethod('staking', 'nominate')(model.nominates);
    const txFunc = (model.stash as any as SubstrateAccount).batchTx([nominateTx]);
    txFunc.cb = model.txCallback;
    openTXModal(txFunc);
  },
  txCallback: (success) => {
    model.txSuccess = success;
  }
};

const SetNominators = makeDynamicComponent<SetNominatorsAttrs, SetNominatorsState>({
  oncreate: (vnode) => {
    model.stash = app.chain.accounts.get(vnode.attrs.stashId);
  },
  getObservables: () => ({
    groupKey: app.chain.class.toString()
  }),
  view: (vnode) => {
    const { controllerId, stashId } = vnode.attrs;

    return m('.SetValidator.manage-staking', [
      m('.compact-modal-title.center-lg', [
        m('h3', [ 'Set Validator Preferences' ]),
      ]),
      m('.compact-modal-body',
        m('span', [
          m(StashController, { controllerId, stashId }),
          m(Nominate, {
            onChange: model.onNominateChange
          }),
          m('div.center-lg.padding-t-10', [
            !model.txSuccess
            && m('button.cui-button.cui-align-center.cui-primary', {
              disabled: !model.nominates.length,
              onclick: model.bond,
            }, 'Validate'),
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

export default SetNominators;
