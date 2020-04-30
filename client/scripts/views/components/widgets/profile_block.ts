import 'components/widgets/profile_block.scss';

import { default as m } from 'mithril';
import { default as app } from 'state';
import User from 'views/components/widgets/user';
import { Account, ChainBase } from 'models';
import { formatCoin, Coin } from 'adapters/currency';
import { SubstrateAccount } from 'controllers/chain/substrate/account';
import { makeDynamicComponent } from 'models/mithril';
import { formatAddressShort } from 'helpers';

interface IAttrs {
  account: Account<any>;
  showBalance?: boolean;
  linkify?: boolean;
}

interface IState {
  dynamic: {
    balance: Coin;
    freeBalance?: Coin;
  };
}

const ProfileBlock = makeDynamicComponent<IAttrs, IState>({
  getObservables: (attrs) => {
    return {
      groupKey: attrs.account.address,
      balance: attrs.account.balance,
      freeBalance: attrs.account instanceof SubstrateAccount ? attrs.account.freeBalance : null,
    };
  },
  view: (vnode) => {
    const account = vnode.attrs.account;
    const profile = account.profile;
    const showBalance = vnode.attrs.showBalance;
    const linkify = vnode.attrs.linkify;
    return m('.ProfileBlock', {
      onclick: linkify ? () => {
        m.route.set(`/${account.chain.id}/account/${account.address}`);
      } : '',
    }, [
      m('.profile-block-left', [
        m(User, { user: account, avatarOnly: true, avatarSize: 36, tooltip: true }),
      ]),
      m('.profile-block-right', [
        m('.profile-block-name', [
          m(User, { user: account, hideAvatar: true, tooltip: true }),
          showBalance && m('span.balance', vnode.state.dynamic.balance === undefined ? '--'
            : formatCoin(vnode.state.dynamic.balance, true)),
        ]),
        m('.profile-block-address', {
          class: profile && profile.address ? '' : 'no-address',
        }, [
          profile && profile.address && formatAddressShort(profile.address),
          !app.chain && ` (${account.chain.id})`,
        ]),
      ]),
    ]);
  }
});

export default ProfileBlock;
