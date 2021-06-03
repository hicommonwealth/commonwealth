import 'components/commonwealth/members_card.scss';

import m from 'mithril';
import { utils } from 'ethers';

import app from 'state';
import { CWProject } from 'models/CWProtocol';

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
    ])
  }
}

const connectionReady = () => {
  if (!app.chain) return false;
  const protocol = (app.chain as any).protocol;
  if (!protocol || !protocol.initialized || !protocol.memberStore) return false;
  return true;
}

const MembersModule: m.Component<{project: CWProject, protocol: any}, {initialized: boolean, backers: CWUser[], curators: CWUser[]}> = {
  onupdate: async(vnode) => {    
    if (!connectionReady()) return;
    const { project } = vnode.attrs;
    const { backers, curators } = await (app.chain as any).protocol.syncMembers(project.bToken, project.cToken, project.projectHash);
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
}


export default MembersModule;