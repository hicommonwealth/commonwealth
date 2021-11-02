import 'pages/sputnikdaos.scss';

import m from 'mithril';
import _ from 'lodash';
import { Tag, Table } from 'construct-ui';

import app from 'state';
import { navigateToSubpage } from 'app';

import PageLoading from 'views/pages/loading';
import User from 'views/components/widgets/user';
import Sublayout from 'views/sublayout';
import { CommunityOptionsPopover } from './discussions';
import Near from 'controllers/chain/near/main';

interface IDaoInfo {
  contractId: string;
  amount: string;
  name: string;
  purpose: string;
  proposalBond: string;
  proposalPeriod: string;
  bountyBond: string;
  bountyPeriod: string;
  council: string[];
}

const SputnikDAOsPage : m.Component<{}, { daosRequested: boolean, daosList: IDaoInfo[] }> = {
  view: (vnode) => {
    const activeEntity = app.community ? app.community : app.chain;
    if (!activeEntity) return m(PageLoading, {
      message: 'Loading Sputnik DAOs',
      title: [
        'Sputnik DAOs',
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    });

    if(!vnode.state.daosRequested){
      vnode.state.daosRequested = true;
      (app.chain as Near).chain.viewDaoList().then((daos) => {
        console.log(daos);
        vnode.state.daosList = daos;
        vnode.state.daosList.sort((d1, d2) => parseFloat(d2.amount) - parseFloat(d1.amount));
        m.redraw();
      })
    }

    const isAdmin = app.user.isSiteAdmin
    || app.user.isAdminOfEntity({ chain: app.activeChainId(), community: app.activeCommunityId() });
    const isMod = app.user.isRoleOfCommunity({
      role: 'moderator', chain: app.activeChainId(), community: app.activeCommunityId()
    });

    if (!vnode.state.daosList) return m(PageLoading, {
      message: 'Loading Sputnik DAOs',
      title: [
        'Sputnik DAOs',
        m(CommunityOptionsPopover, { isAdmin, isMod }),
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    });

    return m(Sublayout, {
      class: 'SputnikDAOsPage',
      title: [
        'Sputnik DAOs',
        m(CommunityOptionsPopover, { isAdmin, isMod }),
        m(Tag, { size: 'xs', label: 'Beta', style: 'position: relative; top: -2px; margin-left: 6px' })
      ],
      showNewProposalButton: true,
    }, [
      m('.title', 'Sputnik DAOs'),
      m(Table, [
        m('tr', [
          m('th', {style: {width: "27%"}}, 'Name'),
          m('th', {style: {width: "20%"}}, 'Dao Funds ', [ m('span.nearBadge', 'NEAR') ]),
          m('th', {style: {width: "17%"}}, 'Council'),
          m('th', {style: {width: "19%"}}, 'Bond ', [ m('span.nearBadge', 'NEAR') ]),
          m('th', {style: {width: "17%"}}, 'Vote Period'),
        ]),
        vnode.state.daosList.map((dao) => {
          return m('tr.nearRow', {
            onclick: (e) => {
              e.preventDefault();
              m.route.set(`/${dao.contractId}`);
            }
          }, [
            m('td', dao.name),
            m('td', dao.amount),
            m('td', dao.council.length),
            m('td', dao.proposalBond),
            m('td', dao.proposalPeriod),
          ]);
        })
      ]),
    ]);
  }
};

export default SputnikDAOsPage;