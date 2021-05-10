import 'components/project_card.scss';

import m from 'mithril';
import { Tag } from 'construct-ui';

import app from 'state';
import { CWUser, CWProject } from 'models/CWProtocol';

export interface CWProjectWithParticipants extends CWProject {
  backers: Array<CWUser>;
  curators: Array<CWUser>;
  threadId?: string;
}


const ProjectCard: m.Component<{project: CWProjectWithParticipants}> = {
  view: (vnode) => {
    const { project } = vnode.attrs;

    const thredLink = `/${app.activeChainId()}/proposal/discussion/${project.threadId}`; // proposal => project
    const projectLink = `/${app.activeCommunityId()}/project/${project.projectHash}`;
    const bgColor = project.status === 'In Progress' ? 'blue' : (project.status === 'Successed') ? 'green' : 'red';
    const totalFundingText = `Total Funding: ${project.totalFunding}Ether`;
    
    return m('.ProjectCard', [
      m('.project-card-top', {
        onclick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          m.route.set(projectLink); // avoid resetting scroll point
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
          if (project.threadId) {
            m.route.set(thredLink);
          }
        }
      }, [
        // thread link
        project.threadId ? m('.project-thread-link', [
          m('a', { href: thredLink }, 'Go to thread'),
        ]) : m('.no-linked-thread', 'No linked thread'),
      ]),
    ]);
  }
}

export default ProjectCard;
