import 'components/commonwealth/members_card.scss';

import m from 'mithril';

import app from 'state';
import { CWUser, CWProject } from 'models/CWProtocol';


const UserComp: m.Component<{user: CWUser, project: CWProject}> = {
  view: (vnode) => {
    const { user, project } = vnode.attrs;
    const backedAmount = `${user.amount}ETH`;
    // const shortAddress = user.address.slice(0, 5) + '...';
    return m('.member', [
      m('.text', user.address),
      m('.text', backedAmount),
    ])
  }
}

const MembersModule: m.Component<{project: CWProject}, {initalized: boolean, backers: any[], curators: any[]}> = {
  oncreate: async (vnode) => {
    if (!vnode.state.initalized) {
      if (!app.chain || !(app.chain as any).protocol) {
        return;
      }
      vnode.state.backers = await (app.chain as any).protocol.getTokenHolders(vnode.attrs.project.bToken);
      vnode.state.curators = await (app.chain as any).protocol.getTokenHolders(vnode.attrs.project.cToken);
      vnode.state.initalized = true;
      m.redraw();
    }
  },
  view: (vnode) => {
    const { project } = vnode.attrs;
    
    const backers = [];
    const curators = [];

    const backersContent = backers.map((backer) => m(UserComp, { user: backer, project }));
    const curatorsContent = curators.map((curator) => m(UserComp, { user: curator, project }));

    return m('.row .members-card', [
      m('.col-lg-6', [
        m('.title', 'Backers'),
        backersContent,
        m('.text .mt-10px', `Backers' funds will go to the project if the funding threshold is reached.`)
      ]),
      m('.col-lg-6', [
        m('.title', 'Curator'),
        curatorsContent,
        m('.text .mt-10px', `Curators received 5% of the total raise if the project is successful. You should curate.`)
      ])
    ]);
  }
}


export default MembersModule;