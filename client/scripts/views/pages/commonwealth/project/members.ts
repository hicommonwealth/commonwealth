import 'pages/commonwealth/projects.scss';

import m from 'mithril';

import { CWProject } from 'models/CWProtocol';


const UserComp: m.Component<{user: any, project: CWProject}> = {
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

const MembersModule: m.Component<{project: CWProject}, {}> = {
  view: (vnode) => {
    const { project } = vnode.attrs;
    const backersContent = project.backers.map((backer) => m(UserComp, { user: backer, project }));
    const curatorsContent = project.curators.map((curator) => m(UserComp, { user: curator, project }));

    return m('.row .members-area', [
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