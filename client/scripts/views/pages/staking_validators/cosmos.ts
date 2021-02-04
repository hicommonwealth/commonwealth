import m from 'mithril';

import app from 'state';
import { formatCoin } from 'adapters/currency';
import { pluralize } from 'helpers';
import { FormGroup, FormLabel, Input, Button } from 'construct-ui';

import { Account } from 'models';
import { CosmosToken } from 'adapters/chain/cosmos/types';
import Cosmos from 'controllers/chain/cosmos/main';
import { ICosmosValidator, CosmosAccount, CosmosValidatorState } from 'controllers/chain/cosmos/account';
import { createTXModal } from 'views/modals/tx_signing_modal';
import User from 'views/components/widgets/user';
import Tabs from 'views/components/widgets/tabs';
import { formatAddressShort } from '../../../../../shared/utils';

import { IValidatorAttrs } from '.';

export interface ICosmosDelegationState {
  error: any;
  sending: boolean;
  delegationAmount: CosmosToken;
  isDelegating: boolean;
}

export const NewCosmosDelegationModal : m.Component<{ validatorAddr }, ICosmosDelegationState> = {
  view: (vnode) => {
    const sender = app.user.activeAccount;

    return m('.ManageStakingModal', [
      m('.compact-modal-title', [
        m('h3', `Create delegation to ${formatAddressShort(vnode.attrs.validatorAddr, null)}`), // TODO: provide chain
      ]),
      m('.compact-modal-body', [
        m('.NewStashForm', [
          m(FormGroup, [
            m(FormLabel, 'Amount'),
            m(Input, {
              placeholder: 'Enter amount to delegate:',
              oninput: (e) => {
                const result = (e.target as any).value;
                vnode.state.delegationAmount = app.chain.chain.coins(parseFloat(result), true);
              }
            })
          ]),
          m(Button, {
            intent: 'primary',
            disabled: !app.user.activeAccount,
            onclick: (e) => {
              e.preventDefault();
              try {
                vnode.state.sending = true;
                const validator = app.chain.accounts.get(vnode.attrs.validatorAddr);
                if (sender instanceof CosmosAccount) {
                  createTXModal(sender.delegateTx(validator, vnode.state.delegationAmount))
                    .then(() => {
                      vnode.state.sending = false;
                      m.redraw();
                    })
                    .catch((err) => {
                      vnode.state.sending = false;
                      m.redraw();
                    });
                } else {
                  // TODO: cosmos balance transfer
                  throw new Error('Can only delegate on Cosmos based chain.');
                }
              } catch (err) {
                vnode.state.error = err.message;
                vnode.state.sending = false;
                m.redraw();
              }
            },
            label: 'Delegate'
          }),
        ]),
      ])
    ]);
  }
};

export interface IManageCosmosModalState {
  validators: Account<any> | ICosmosValidator;
}

export const CosmosValidatorRow: m.Component<IValidatorAttrs> = {
  view: (vnode) => {
    let isDelegated: boolean = false;
    /*
      Check if we're already delegated to a validator and present the unbond option if so
    */
    if (app.user.activeAccount) {
      const account = app.chain.accounts.get(app.user.activeAccount.address);
      const delegation = (account.balance.value) ? account.delegations() : null;
      isDelegated = (delegation)
        ? (delegation[vnode.attrs.stash] !== 0) : false;
    }

    return m('tr.ValidatorRow', [
      m('td.val-name', (vnode.attrs.name !== null) ? vnode.attrs.name : 'Validator'),
      m('td.val-stash', m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true })),
      m('td.val-total', formatCoin(vnode.attrs.total, true)),
      m('td.val-action', [
        !isDelegated && m(Button, {
          class: 'nominate-validator',
          intent: 'primary',
          disabled: !app.user.activeAccount,
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({
              modal: NewCosmosDelegationModal,
              data: { validatorAddr: vnode.attrs.stash, isDelegating: true },
            });
          }
        }, 'Delegate'),
        isDelegated && m(Button, {
          class: 'nominate-validator',
          intent: 'primary',
          disabled: !app.user.activeAccount,
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({
              modal: NewCosmosDelegationModal,
              data: { validatorAddr: vnode.attrs.stash, isDelegating: false },
            });
          }
        }, 'Unbond'),
      ]),
    ]);
  }
};

export const ValidationPreHeader = (chain: Cosmos) => {
  const validators = chain.accounts.validators;
  if (!validators) return;
  let totalStaked = chain.chain.coins(0);
  Object.entries(validators).forEach(([_validator, { tokens }]) => {
    const valStake = chain.chain.coins(Number(tokens));
    totalStaked = chain.chain.coins(totalStaked.add(valStake));
  });

  return m('.validators-preheader', [
    m('.validators-preheader-item', [
      m('h3', 'Current Block'),
      m('.preheader-item-text', chain.block.height),
    ]),
    m('.validators-preheader-item', [
      m('h3', 'Total Staked'),
      m('.preheader-item-text', totalStaked.format(true)),
    ]),
  ]);
};

export const ValidatorPresentationComponent = (chain: Cosmos) => {
  const validators: { [address: string]: ICosmosValidator } = chain.accounts.validators;
  if (!validators) return;
  return m(Tabs, [{
    name: 'Bonded Validators',
    content: m('table.validators-table', [
      m('tr.validators-heading', [
        m('th.val-name', 'Name'),
        m('th.val-stash', 'Validator'),
        m('th.val-total', 'Total Bonded'),
        m('th.val-action', ''),
      ]),
      Object.keys(validators)
        .filter((validator) => ((validators[validator].status === CosmosValidatorState.Bonded)
                                && (!validators[validator].isJailed)))
        .sort((val1, val2) => validators[val2].tokens - validators[val1].tokens)
        .map((validator) => {
          const total = app.chain.chain.coins(validators[validator].tokens);
          return m(CosmosValidatorRow, {
            name: validators[validator].description.moniker,
            stash: validator,
            total
          });
        }),
    ])
  }, {
    name: 'Unbonded',
    content: m('table.validators-table', [
      m('tr.validators-heading', [
        m('th.val-name', 'Name'),
        m('th.val-stash', 'Validator'),
        m('th.val-total', 'Total Bonded'),
        m('th.val-action', ''),
      ]),
      Object.keys(validators)
        .filter((validator) => ((validators[validator].status === CosmosValidatorState.Unbonded)
                                && (!validators[validator].isJailed)))
        .sort((val1, val2) => validators[val2].tokens - validators[val1].tokens)
        .map((validator) => {
          const total = app.chain.chain.coins(validators[validator].tokens);
          return m(CosmosValidatorRow, {
            name: validators[validator].description.moniker,
            stash: validator,
            total
          });
        }),
    ])
  }, {
    name: 'Jailed',
    content: m('table.validators-table', [
      m('tr.validators-heading', [
        m('th.val-name', 'Name'),
        m('th.val-stash', 'Validator'),
        m('th.val-total', 'Total Bonded'),
        m('th.val-action', ''),
      ]),
      Object.keys(validators).filter((validator) => (validators[validator].isJailed))
        .map((validator) => {
          const total = app.chain.chain.coins(validators[validator].tokens);
          return m(CosmosValidatorRow, {
            name: validators[validator].description.moniker,
            stash: validator,
            total
          });
        }),
    ]),
  }]);
};
