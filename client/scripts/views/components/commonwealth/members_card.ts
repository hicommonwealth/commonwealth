import 'components/commonwealth/members_card.scss';

import m from 'mithril';
import { utils } from 'ethers';
import app from 'state';
import { CMNProject } from 'models';
import { protocolReady } from 'controllers/chain/ethereum/commonwealth/utils';
export interface CWUser {
  balance: number;
  address: string;
}

const UserComp: m.Component<{user: CWUser}> = {
  view: (vnode) => {
    const { user } = vnode.attrs;
    // const shortAddress = user.address.slice(0, 5) + '...';
    return m('.member', [
      m('.text', user.address),
      m('.text', `${utils.formatEther(user.balance)}ETH`),
    ]);
  }
};

const MembersModule: m.Component<
  {
    project: CMNProject,
    project_protocol: any
  },
  {
    initialized: boolean,
    backers: CWUser[],
    curators: CWUser[]
  }
> = {
  onupdate: async (vnode) => {
    if (!protocolReady()) return;
    const { project } = vnode.attrs;
    const { backers, curators } = await (app.chain as any).project_protocol.getMembers(
      project
    );
    vnode.state.backers = backers;
    vnode.state.curators = curators;
    if (!vnode.state.initialized) {
      vnode.state.initialized = true;
      m.redraw();
    }
  },
  view: (vnode) => {
    const { curators, backers } = vnode.state;
    const backersContent = backers.map((backer) => m(UserComp, { user: backer }));
    const curatorsContent = curators.map((curator) => m(UserComp, { user: curator }));

    return m('.row .members-card', [
      m('.col-lg-6', [
        m('.title', 'Backers'),
        m('.text .mt-10px', 'Backers funds will go to the project if the funding threshold is reached.'),
        backersContent
      ]),
      m('.col-lg-6', [
        m('.title', 'Curator'),
        m('.text .mt-10px', 'Curators received 5% of the total raise if the project is successful.'),
        curatorsContent,
      ])
    ]);
  }
};

export default MembersModule;
