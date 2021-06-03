import 'components/commonwealth/project_card.scss';

import { utils } from 'ethers';
import m from 'mithril';
import { Tag } from 'construct-ui';

import app from 'state';
import { CWProject } from 'models/CWProtocol';

const ProjectCard: m.Component<{project: CWProject}> = {
  view: (vnode) => {
    const { project } = vnode.attrs;

    // const thredLink = `/${app.activeChainId()}/proposal/discussion/${project.threadId}`; // proposal => project
    const bgColor = project.status === 'In Progress' ? 'blue' : (project.status === 'Successed') ? 'green' : 'red';
    const totalFunding = utils.formatEther(project.totalFunding.asBN.toString());
    const totalFundingText = `Total Funding: ${totalFunding} Ether`;
    
    return m('.ProjectCard', [
      m('.project-card-top', {
        onclick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          m.route.set(`/${app.activeChainId()}/project/${project.projectHash}`); // avoid resetting scroll point
          },
        }, [
          m(Tag, {
            label: ['Project #', project.projectHash.substring(0, 5)],
            intent: 'primary',
            rounded: true,
            size: 'xs',
            style: `background: ${bgColor}`
          }),
          m('.project-title', project.name),
          m('.project-amount', totalFundingText),
          m('.project-description', project.description),
      ]),

      m('.project-card-bottom', {
        onclick: (e) => {
          e.preventDefault();
          // if (project.threadId) {
          //   m.route.set(thredLink);
          // }
        }
      }, [
        // // thread link
        // project.threadId ? m('.project-thread-link', [
        //   m('a', { href: thredLink }, 'Go to thread'),
        // ]) : m('.no-linked-thread', 'No linked thread'),
        m('.no-linked-thread', 'No linked thread')
      ]),
    ]);
  }
}

export default ProjectCard;