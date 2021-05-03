import 'pages/commonwealth/projects.scss';

import m from 'mithril';

import { AnyProject, UserType } from 'views/components/project_card';


const UserComp: m.Component<{user: UserType, project: AnyProject}> = {
  view: (vnode) => {
    const { user, project } = vnode.attrs;
    const backedAmount = `${user.amount} ${project.token}`;
    const shortAddress = user.address.slice(0, 5) + '...';
    const userInfo = `${user.name} - ${shortAddress}`;
    return m('.member', [
      m('.text', userInfo),
      m('.text', backedAmount),
    ])
  }
}

const MembersModule: m.Component<{project: AnyProject}, {}> = {
  view: (vnode) => {
    const { project } = vnode.attrs;
    const backersContent = project.backers.map((backer: UserType) => m(UserComp, { user: backer, project }));
    const curatorsContent = project.curators.map((curator: UserType) => m(UserComp, { user: curator, project }));

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