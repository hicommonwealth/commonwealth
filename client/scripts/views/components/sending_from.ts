import 'components/sending_from.scss';

import { default as m } from 'mithril';
import User from 'views/components/widgets/user';
import { Coin } from 'adapters/currency';
import { makeDynamicComponent } from 'models/mithril';
import { Account } from 'models';

// TODO: update this to be generic to all Accounts
interface IAttrs {
  author: Account<any>;
  showBalance?: boolean;
}

interface IState {
  dynamic: {
    balance: Coin;
  };
}

const SendingFrom = makeDynamicComponent<IAttrs, IState>({
  getObservables: (attrs: IAttrs) => {
    return {
      groupKey: attrs.author.address,
      balance: attrs.author.balance,
    };
  },
  view: (vnode: m.VnodeDOM<IAttrs, IState>) => {
    const { author, showBalance } = vnode.attrs;
    const balance = vnode.state.dynamic.balance;
    return m('.SendingFrom', [
      m('span.sending-from', m(User, { user: author })),
      showBalance && m('span.sending-from-balance', [
        'Free: ',
        balance === undefined ? '--' : balance.format(true),
      ]),
    ]);
  }
});

export default SendingFrom;
