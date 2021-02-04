import m from 'mithril';
import app from 'state';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import SubstrateAccounts, { SubstrateAccount } from 'controllers/chain/substrate/account';
import { isU8a, isHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/keyring';
import ActionForm from './action_form';

interface IStashFormState {
  bondAmount: SubstrateCoin;
  controllerAddress: SubstrateAccount;
  rewardDestination: string;
  sending: boolean;
  error: any;
}

const NewStashForm: m.Component<{}, IStashFormState> = {
  oncreate: (vnode) => {
    vnode.state.rewardDestination = 'stash';
  },
  view: (vnode) => m('.NewStashForm', [
    m(ActionForm, {
      isTextInput: true,
      titleMsg: 'Set bonded controller',
      actionName: 'bond',
      placeholder: 'Enter a controller address',
      errorMsg: 'Can only set controller on Substrate based chain.',
      onChangeHandler: (newController) => {
        vnode.state.controllerAddress = null;

        const address = newController;
        if (isU8a(address) || isHex(address)) {
          return;
        }
        console.log('controller', address);
        try {
          const addr = decodeAddress(address);
          console.log(addr);
        } catch (e) {
          return;
        }

        vnode.state.controllerAddress = (app.chain.accounts as SubstrateAccounts).fromAddress(newController);
      },
    }),
    m(ActionForm, {
      isTextInput: true,
      titleMsg: 'Set bond amount',
      actionName: 'bond',
      placeholder: 'Enter a bond amount',
      errorMsg: 'Can only set bond on Substrate based chain.',
      onChangeHandler: (bondAmount) => { vnode.state.bondAmount = (app.chain.chain.coins(+bondAmount, true)); },
    }),
    m(ActionForm, {
      isTextInput: false,
      titleMsg: 'Set Payee',
      actionName: 'Create new stash',
      placeholder: 'Set new reward destination',
      errorMsg: 'Can only bond on Substrate based chain.',
      options: {
        name: 'rewardDestination',
        style: 'padding: 5px',
      },
      choices: [
        { value: 'staked', label: 'Stash account (increase the amount at stake)' },
        { value: 'stash', label: 'Stash account (do not increase the amount at stake)' },
        { value: 'controller', label: 'Controller account' },
      ],
      defaultValue: 'staked',
      onChangeHandler: (payee) => {
        vnode.state.rewardDestination = payee;
        return vnode.state.rewardDestination;
      },
      actionHandler: () => {
        const { controllerAddress, bondAmount, rewardDestination } = vnode.state;
        if (controllerAddress && bondAmount && rewardDestination) {
          console.log(controllerAddress, bondAmount, rewardDestination);
          const sender = (app.user.activeAccount as SubstrateAccount);
          return sender.bondTx(controllerAddress, bondAmount, rewardDestination);
        }
      },
    }),
  ]),
};

export default NewStashForm;
