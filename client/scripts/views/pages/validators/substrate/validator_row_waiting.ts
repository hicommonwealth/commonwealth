import m from 'mithril';
import app from 'state';
import { ChainBase } from 'models';
import { pluralize } from 'helpers';
import User from 'views/components/widgets/user';
import Substrate from 'controllers/chain/substrate/main';
import { makeDynamicComponent } from 'models/mithril';
import { IValidatorAttrs, ViewNominatorsModal } from '..';
import { expandInfo, IValidatorState } from './validator_row';
import ImOnline from './im_online';

const ValidatorRowWaiting = makeDynamicComponent<IValidatorAttrs, IValidatorState>({
  oninit: (vnode) => {
    vnode.state.isNominating = vnode.attrs.hasNominated;
  },
  getObservables: (attrs) => ({
    // we need a group key to satisfy the dynamic object constraints, so here we use the chain class
    groupKey: app.chain.class.toString(),
    query: (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.query(attrs.stash)
      : null
  }),
  view: (vnode) => {
    const { query } = vnode.state.dynamic;
    const nominations = (app.chain.base === ChainBase.Substrate)
      ? (app.chain as Substrate).staking.nominations
      : {};
    const stakingInfo = query
      ? expandInfo(query)
      : null;
    const nominatorsList = nominations[vnode.attrs.stash] || [];
    return m(`tr.ValidatorRow${vnode.attrs.toBeElected ? '.waiting' : '.nextValidator'}`, [
      m('td.val-stash', m(User, { user: app.chain.accounts.get(vnode.attrs.stash), linkify: true })),
      m('td.val-nominations', [
        m('a.val-nominations', {
          href: '#',
          onclick: (e) => {
            e.preventDefault();
            app.modals.create({
              modal: ViewNominatorsModal,
              data: { nominators: nominatorsList, validatorAddr: vnode.attrs.stash, waiting: true }
            });
          }
        }, pluralize(nominatorsList.length, 'Nomination')),
      ]),
      m('td.val-commission', stakingInfo?.commission || ' '),
      m(ImOnline, {
        toBeElected: vnode.attrs.toBeElected,
        isOnline: vnode.attrs.isOnline,
        hasMessage: vnode.attrs.hasMessage,
        blockCount: vnode.attrs.blockCount
      })
    ]);
  }
});

export default ValidatorRowWaiting;
