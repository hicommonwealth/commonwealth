import 'components/sending_from.scss';

import m from 'mithril';
import User from 'views/components/widgets/user';
import { Coin } from 'adapters/currency';
import { Account } from 'models';
import app from 'state';

// TODO: update this to be generic to all Accounts
interface IAttrs {
  author: Account<any>;
  showBalance?: boolean;
}

interface IState {
  balance: Coin;
}

const SendingFrom = {
  oninit: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    app.runWhenReady(async () => {
      vnode.state.balance = await vnode.attrs.author.balance;
      m.redraw();
    });
  },
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    const { author, showBalance } = vnode.attrs;
    const balance = vnode.state.balance;
    return m('.SendingFrom', [
      m('span.sending-from', m(User, { user: author })),
      showBalance &&
        m('span.sending-from-balance', [
          'Free: ',
          balance === undefined ? '--' : balance.format(true),
        ]),
    ]);
  },
};

export default SendingFrom;
