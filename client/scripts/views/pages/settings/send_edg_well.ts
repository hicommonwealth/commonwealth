import 'pages/settings/send_edg_well.scss';

import m from 'mithril';
import app from 'state';
import { Button, Icon, Icons } from 'construct-ui';

import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { formatCoin } from 'adapters/currency';
import { createTXModal } from 'views/modals/tx_signing_modal';
import { ChainBase } from 'types';
import { Account } from 'models';
import { SubstrateCoin } from 'adapters/chain/substrate/types';
import Substrate from 'controllers/chain/substrate/main';
import AddressInput from 'views/components/addresses/address_input';

const getBalanceTransferChecks = (
  senderBalance : SubstrateCoin,
  recipientBalance : SubstrateCoin,
  amount : SubstrateCoin,
  recipientAddress : string,
  senderAddress : string,
  txFee : SubstrateCoin,
): [ boolean, any[] ] => {
  const checks: any[] = [];
  let canTransfer: boolean = true;
  if (senderAddress === recipientAddress) {
    checks.push([
      m(Icon, { name: Icons.X, size: 'sm' }),
      'You cannot send balance to yourself']);
    canTransfer = false;
  } else if (senderBalance.lt(amount)) {
    checks.push([
      m(Icon, { name: Icons.X, size: 'sm' }),
      'You do not have the required balance for this transaction.']);
    canTransfer = false;
  } else if (senderBalance.sub(amount).lt((app.chain as Substrate).chain.existentialdeposit)) {
    checks.push([
      m(Icon, { name: Icons.INFO, size: 'sm' }),
      'Your balance will drop below the minimum, and any remaining balance may be lost.'
    ]);
  }
  if (canTransfer && txFee.gtn(0)) {
    checks.push([
      m(Icon, { name: Icons.INFO, size: 'sm' }),
      `Transfer fee: ${formatCoin(txFee)}`
    ]);
  }

  const resultingBalance = app.chain.chain.coins(recipientBalance.add(amount.sub(txFee)));
  if (recipientBalance.eqn(0) && resultingBalance.lt((app.chain as Substrate).chain.existentialdeposit)) {
    checks.push([
      m(Icon, { name: Icons.X, size: 'sm' }),
      'The recipient\'s balance must be above the minimum after fees: '
        + `${formatCoin((app.chain as Substrate).chain.existentialdeposit)}`]);
    canTransfer = false;
  } else if (amount.lte(txFee)) {
    checks.push([
      m(Icon, { name: Icons.X, size: 'sm' }),
      'Amount sent must be greater than the transfer fee.']);
    canTransfer = false;
  } else if (canTransfer) {
    checks.push([
      m(Icon, { name: Icons.INFO, size: 'sm' }),
      `Recipient's balance after this transfer: ${formatCoin(resultingBalance)}`]);
  }
  return [canTransfer, checks];
};

const fetchBalance = (address: string) => {
  const recipient: Account<any> = app.chain.accounts.get(address);
  return recipient.balance;
};

interface IAttrs {
  sender: Account<any>;
}

interface IState {
  senderBalance: SubstrateCoin;
  substrateTxFee: SubstrateCoin;
  recipientBalance: SubstrateCoin;
  recipientAddress: string;
  amount: SubstrateCoin;
  sending: boolean;
  error: string;
}

const SendEDGWell: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    app.runWhenReady(async () => {
      vnode.state.senderBalance = await vnode.attrs.sender.balance;
      vnode.state.substrateTxFee = vnode.attrs.sender.chainBase === ChainBase.Substrate
        ? await (vnode.attrs.sender as SubstrateAccount).balanceTransferFee
        : null;
      m.redraw();
    });
  },
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    let canTransfer = true;
    let checks = [];
    if (vnode.attrs.sender && vnode.state.recipientBalance && vnode.state.amount) {
      [ canTransfer, checks ] = getBalanceTransferChecks(
        vnode.state.senderBalance,
        vnode.state.recipientBalance,
        vnode.state.amount,
        vnode.state.recipientAddress,
        vnode.attrs.sender.address,
        vnode.state.substrateTxFee,
      );
    }

    if (!app.chain) return;

    return m('.SendEDGWell', [
      m('h4', `Send ${(app.chain && app.chain.chain && app.chain.chain.denom) || 'balance'}`),
      m('p', [
        m(AddressInput, {
          currentPrefix: app.chain.base === ChainBase.Substrate ? (app.chain as Substrate).chain.ss58Format : null,
          autoReencode: true,
          options: {
            name: 'address',
            placeholder: 'Address',
            autocomplete: 'off',
            value: vnode.state.recipientAddress,
          },
          callback: async (address, error) => {
            console.log(address, error);
            vnode.state.recipientBalance = null;
            if (address) {
              vnode.state.recipientBalance = await fetchBalance(address);
              vnode.state.recipientAddress = address;
              m.redraw();
            } else if (error) {
              console.error(error);
            }
          },
        }),
        m('input[type="text"]', {
          name: 'amount',
          placeholder: 'Amount',
          autocomplete: 'off',
          oninput: (e) => {
            try {
              vnode.state.amount = app.chain.chain.coins(parseFloat(e.target.value), true);
              vnode.state.error = undefined;
            } catch (err) {
              vnode.state.error = 'invalid amount';
              vnode.state.amount = undefined;
            }
          }
        }),
      ]),
      !vnode.attrs.sender && m('.send-edg-checks', [
        m('.send-edg-check', [
          m(Icon, { name: Icons.X, size: 'sm' }),
          `No ${app.chain && app.chain.chain && app.chain.chain.denom} address to send from`,
        ]),
      ]),
      vnode.attrs.sender
      && vnode.state.recipientBalance
      && vnode.state.amount !== undefined
      && m('.send-edg-checks', [
        m('.send-edg-check', [
          m(Icon, { name: Icons.INFO, size: 'sm' }),
          `Sending: ${formatCoin(vnode.state.amount)}`
        ]),
        checks.map((check) => m('.send-edg-check', check)),
      ]),
      m(Button, {
        class: 'formular-primary-button',
        disabled: (!vnode.state.recipientBalance
                || !vnode.state.amount
                || !canTransfer
                || vnode.state.sending),
        type: 'submit',
        rounded: true,
        onclick: async (e) => {
          e.preventDefault();
          const address = vnode.state.recipientAddress;
          const amount = vnode.state.amount;
          const sender = vnode.attrs.sender;
          if (!address || !amount || !sender) return;
          try {
            vnode.state.sending = true;
            if (sender instanceof SubstrateAccount) {
              const account = app.chain.accounts.get(address);
              createTXModal(sender.sendBalanceTx(account, amount)).then(() => {
                vnode.state.sending = false;
                m.redraw();
              }, (err) => {
                vnode.state.sending = false;
                m.redraw();
              });
            } else {
              // TODO: cosmos balance transfer
              throw new Error('Can only send balance on Substrate-based networks');
            }
          } catch (err) {
            vnode.state.error = err.message;
            vnode.state.sending = false;
            m.redraw();
          }
        }
      }, `Send ${app.chain && app.chain.chain && app.chain.chain.denom}`),
      m('span.error-message', vnode.state.error),
    ]);
  }
};

export default SendEDGWell;
