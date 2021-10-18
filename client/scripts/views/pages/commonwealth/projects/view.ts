/* eslint-disable no-mixed-operators */
import 'pages/commonwealth/projects/view.scss';
import m from 'mithril';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import ActionModule from 'views/components/commonwealth/actions/action_card';
import { CMNProject } from 'models';
import { protocolReady } from 'controllers/chain/ethereum/commonwealth/utils';

function secondsToDhms(seconds) {
  seconds = Number(seconds);

  if (seconds >= 0) {
    const dd = Math.floor(seconds / (3600 * 24));
    const hh = Math.floor((seconds % (3600 * 24)) / 3600);
    const mm = Math.floor((seconds % 3600) / 60);
    const ss = Math.floor(seconds % 60);

    const dDisplay = dd > 0 ? dd + (dd === 1 ? ' day, ' : ' days, ') : '';
    const hDisplay = hh > 0 ? hh + (hh === 1 ? ' hour, ' : ' hours, ') : '';
    const mDisplay = mm > 0 ? mm + (mm === 1 ? ' minute, ' : ' minutes ') : '';
    const sDisplay = ss > 0 ? ss + (ss === 1 ? ' second' : ' seconds') : '';
    return dDisplay + hDisplay + mDisplay + sDisplay;
  }
  return '0 seconds';
}

const ProjectContentModule: m.Component<
  {
    project: CMNProject;
    leftInSeconds: number;
  },
  undefined
> = {
  oncreate: async (vnode) => {
    if (vnode.attrs.leftInSeconds > 0) {
      setTimeout(() => {
        m.redraw();
      }, 1000 * 60);
    }
  },
  view: (vnode) => {
    const { project, leftInSeconds } = vnode.attrs;
    const leftTime =
      project.status === 'In Progress'
        ? `${secondsToDhms(leftInSeconds)} left`
        : project.status;
    const textColorStyle = {
      color:
        project.status === 'In Progress'
          ? 'blue'
          : project.status === 'Successed'
          ? 'green'
          : 'red',
    };

    return m('.row .content-area', [
      m('.col-lg-12', [
        m('div.project-name', project.name),
        m('div.project-text', [
          m('span', 'A project by created by'),
          m('span.bold', ` ${project.beneficiary}`),
        ]),
        m('div.project-description', { style: textColorStyle }, leftTime),
        m('div.project-description', project.description),
      ]),
    ]);
  },
};

// const TokenHolders: m.Component<
//   {
//     holders: {
//       balance: number;
//       address: string;
//     }[];
//     token: string;
//   },
//   undefined
// > = {
//   view: (vnode) => {
//     const { holders, token } = vnode.attrs;
//     const holderContent = holders.map((holder) =>
//       m('.member', [m('.text', holder.address), m('.text', holder.balance)])
//     );
//     return m('div', [m('p', token), holderContent]);
//   },
// };

const ViewProjectPage: m.Component<
  {
    address: string;
  },
  {
    initialized: number;
    project: CMNProject;
    curators: any;
    backers: any;
  }
> = {
  oncreate: async (vnode) => {
    vnode.state.initialized = 0;
  },
  onupdate: async (vnode) => {
    if (!protocolReady()) return;

    if (vnode.state.initialized === 0) {
      const res = await app.cmnProtocol.project_protocol.getProjectDetails(
        vnode.attrs.address
      );
      vnode.state.backers = res.backers;
      vnode.state.curators = res.curators;
      vnode.state.project = res.project;
      vnode.state.initialized = 1;
      m.redraw();
    }
  },
  view: (vnode) => {
    if (vnode.state.initialized !== 1) return m(PageLoading);

    const { project, curators, backers } = vnode.state;

    if (!project || !project.endTime) {
      return m(
        Sublayout,
        {
          class: 'ProjectPage',
          title: 'Projects',
          showNewProposalButton: true,
        },
        [m('.container', 'This project does not exist.')]
      );
    }
    const project_protocol = app.cmnProtocol.project_protocol;
    const { bTokens, cTokens, endTime } = project;

    // const backersContent = project.acceptedTokens.map((token) => m(
    //   TokenHolders,
    //   { holders: backers[token], token: bTokens[token] }
    // ));
    // const curatorsContent = project.acceptedTokens.map((token) => m(
    //   TokenHolders, { holders: curators[token], token: cTokens[token] }
    // ));

    return m(
      Sublayout,
      {
        class: 'ProjectPage',
        title: 'Projects',
        showNewProposalButton: true,
      },
      [
        m('.container', [
          m(ProjectContentModule, {
            project,
            leftInSeconds: (endTime.getTime() - new Date().getTime()) / 1000,
          }),
          m(ActionModule, { project, project_protocol, backers, curators }),
          m('.row .members-card', [
            m('.col-lg-6', [
              m('.title', 'Backers'),
              m(
                '.text .mt-10px',
                'Backer funds will go to the project if the funding threshold is reached.'
              ),
              // backersContent
            ]),
            m('.col-lg-6', [
              m('.title', 'Curator'),
              m(
                '.text .mt-10px',
                'Curators received 5% of the total raise if the project is successful. You should curate.'
              ),
              // curatorsContent,
            ]),
          ]),
        ]),
      ]
    );
  },
};

export default ViewProjectPage;
