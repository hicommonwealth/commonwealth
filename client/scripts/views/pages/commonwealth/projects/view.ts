import 'pages/commonwealth/projects/view.scss';

import m from 'mithril';
import { utils } from 'ethers';

import app from 'state';
import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';
import { CWProject } from 'models/CWProtocol';

import ActionModule from 'views/components/commonwealth/actions/action_card';


function secondsToDhms(seconds) {
  seconds = Number(seconds);

  if (seconds >= 0) {
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);
    
    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
  }
  return '0 seconds';
}
  
const ProjectContentModule: m.Component<{
  project: CWProject,
  leftInSeconds: number,
  forceUpdateStatus: () => void,
}, {}> = {
  oncreate: async(vnode) => {
    if (vnode.attrs.leftInSeconds > 0) {
      setTimeout(() => { m.redraw(); }, 1000);
    } else {
      await vnode.attrs.forceUpdateStatus();
    }
  },
  view: (vnode) => {
    const { project, leftInSeconds } = vnode.attrs;
    const leftTime = project.status === 'In Progress' ? `${secondsToDhms(leftInSeconds)} left`: project.status;
    const textColorStyle = { color: project.status === 'In Progress' ? 'blue': project.status === 'Successed' ? 'green' : 'red' }

    return m('.col-lg-8 .content-area', [
      m('div.project-name', project.name),
      m('div.project-text', [
        m('span', 'A project by created by'),
        m('span.bold', ` ${project.beneficiary}`),
      ]),
      m('div.project-description', { style: textColorStyle}, leftTime),
      m('div.project-description', project.description)
    ]);
  }
}

const ViewProjectPage: m.Component<{
  projectHash: string
},
{
  initialized: boolean,
  project: CWProject,
}> = {
  oncreate: async(vnode) => {
    vnode.state.initialized = false;
  },
  onupdate: async(vnode) => {
    if (!app.chain || vnode.state.initialized) return;

    const protocol = (app.chain as any).protocol;
    if (!protocol || !protocol.initialized || !protocol.projectStore) return;

    const projects = await (app.chain as any).protocol.syncProjects();
    const project = projects.filter((item) => item.projectHash === vnode.attrs.projectHash)[0];
    await (app.chain as any).protocol.syncMembers(project.bToken, project.cToken, project.projectHash);
    vnode.state.project = project;
    vnode.state.initialized = true;
    m.redraw();
  },
  view: (vnode) => {
    const { project, initialized } = vnode.state;

    if (!initialized) {
      return m(PageLoading);
    }

    const protocol = (app.chain as any).protocol;
    const mStore = protocol.memberStore.getById(project.projectHash);
    const backers = mStore.backers || [];
    const curators = mStore.curators || [];

    const startTime = new Date();
    const endTime = project.endTime;
    const leftInSeconds = (endTime.getTime() - startTime.getTime()) / 1000;

    const backersContent = backers.map((backer) => m('.member', [
      m('.text', backer.address),
      m('.text', `${utils.formatEther(backer.balance)}ETH`),
    ]));
    const curatorsContent = curators.map((curator) => m('.member', [
      m('.text', curator.address),
      m('.text', `${utils.formatEther(curator.balance)}ETH`),
    ]));


    return m(Sublayout, {
      class: 'ProjectPage',
      title: 'Projects',
      showNewProposalButton: true,
    }, [
      m('.container', [
        m('.row', [
          m(ProjectContentModule, { 
            project,
            leftInSeconds,
            forceUpdateStatus: async() => {
              vnode.state.initialized = false;
              await protocol.syncProjects(); 
              vnode.state.initialized = true;
            }
          }),
          m(ActionModule, { project, protocol, backers, curators })
        ]),
        m('.row .members-card', [
          m('.col-lg-6', [
            m('.title', 'Backers'),
            m('.text .mt-10px', `Backers' funds will go to the project if the funding threshold is reached.`),
            backersContent
          ]),
          m('.col-lg-6', [
            m('.title', 'Curator'),
            m('.text .mt-10px', `Curators received 5% of the total raise if the project is successful. You should curate.`),
            curatorsContent,
          ])
        ])
      ]),
    ]);
  }
}

export default ViewProjectPage;