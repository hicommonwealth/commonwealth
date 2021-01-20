import m from 'mithril';
import app from 'state';
import { Popover } from 'construct-ui';
import User from 'views/components/widgets/user';
import { makeDynamicComponent } from 'models/mithril';
import { AccountId } from '@polkadot/types/interfaces';
import Identity from './identity';

interface IRecentBlockState {
  dynamic: { }
}

interface IRecentBlockAttrs {
  author: AccountId;
  hash: string;
  number: string;
}

const RecentBlock = makeDynamicComponent<IRecentBlockAttrs, IRecentBlockState>({
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: app.chain.class.toString(),
  }),
  view: (vnode) => {
    const { author, hash, number } = vnode.attrs;
    return m('tr.ValidatorRow', [
      m('td.val-number', number),
      m('td.val-hash.cut-text', hash),
      m('td.val-author', m(Popover, {
        interactionType: 'hover',
        content: m(Identity, { stash: author.toString() }),
        trigger:  m('div', m(User, { user: app.chain.accounts.get(author.toString()), linkify: true }))
      }))
    ]);
  }
});

export default RecentBlock;
