import 'pages/commonwealth/projects.scss';

import m from 'mithril';
import app from 'state';
import { initChain } from 'app';

import Sublayout from 'views/sublayout';
import PageLoading from 'views/pages/loading';

import { CWProjectWithParticipants } from 'views/components/project_card';

import MembersModule from './members';
import ActionModule from './action';

function secondsToDhms(seconds) {
  seconds = Number(seconds);
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
  
const ProjectContentModule: m.Component<{project: CWProjectWithParticipants, leftInSeconds: number}, {}> = {
  oncreate: (vnode) => {
    if (vnode.attrs.leftInSeconds > 0) {
      setTimeout(() => { m.redraw(); }, 1000);
    }
  },
  view: (vnode) => {
    const { project, leftInSeconds } = vnode.attrs;
    const leftTime = project.status === 'In Progress' ? `${secondsToDhms(leftInSeconds)} left`: project.status;

    return m('.col-lg-8 .content-area', [
      m('div.project-name', project.name),
      m('div.project-text', [
        m('span', 'A project by created by'),
        m('span.bold', `${project.beneficiary.slice(0, 5)}...`),
        m('span', {style: { color: project.status === 'In Progress' ? 'blue': project.status === 'Successed' ? 'green' : 'red' }}, `  : ${leftTime}`, ),
      ]),
      m('div.project-description', project.description)
    ]);
  }
}

const ViewProjectInitialPage: m.Component<{projectHash: string}, {project: CWProjectWithParticipants, initializing: boolean}> = {
  oncreate: async(vnode) => {
    if (!app.chain || !app.chain.loaded) {
      vnode.state.initializing = true;
      await initChain();
      // app.chain.deferred = false;
      vnode.state.initializing = false;
      m.redraw();
    } else if(!vnode.state.project){
      const projects = (app.chain as any).protocol ? (app.chain as any).protocol.get('root').projects : [];
      vnode.state.project = projects.filter((item) => item.projectHash === vnode.attrs.projectHash)[0];
      m.redraw();
    }
  },
  view: (vnode) => {
    const { project } = vnode.state;
    if (vnode.state.initializing || !app.chain || !app.chain.loaded || !(app.chain as any).protocol || !project) {
      return m(PageLoading);
    }
    // if (project) {
    //   return m(ViewProjectPage, { project })
    // }

    const startTime = new Date();
    const endTime = new Date(project.endTime);
    const leftInSeconds = (endTime.getTime() - startTime.getTime()) / 1000;
    return m(Sublayout, {
      class: 'ProjectPage',
      title: 'Projects',
      showNewProposalButton: true,
    }, [
      m('.container', [
        m('.row', [
          m(ProjectContentModule, { project, leftInSeconds }),
          m(ActionModule, { project })
        ]),
        m(MembersModule, { project })
      ]),
    ]);
  }
}

export default ViewProjectInitialPage;