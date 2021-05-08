import 'components/project_card.scss';

import m from 'mithril';
import { Tag } from 'construct-ui';

import app from 'state';
import { slugify } from 'helpers';

export interface UserType {
  address: string;
  name: string;
  amount: number;
}

export interface AnyProject {
  projectId: string;
  name: string;
  description: string;
  identifier: string;
  slug: string;
  threadId: string;
  totalFunding: number;
  threadhold: number;
  token: string;
  backers: UserType[];
  curators: UserType[];
}


const ProjectCard: m.Component<{project: AnyProject}> = {
  view: (vnode) => {
    const { project } = vnode.attrs;

    const thredLink = `/${app.activeChainId()}/proposal/discussion/${project.threadId}`; // proposal => project
    const projectLink = `/${app.activeCommunityId()}/projects/${project.projectId}`;

    return m('.ProjectCard', [
      m('.project-card-top', {
        onclick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          // localStorage[`${app.activeId()}-proposals-scrollY`] = window.scrollY;
          m.route.set(projectLink); // avoid resetting scroll point
          },
        }, [
          // tag
          m(Tag, {
            label: [
              'Project #',
              project.projectId,
            ],
            intent: 'primary',
            rounded: true,
            size: 'xs',
          }),
          // title
          m('.project-title', project.name),

          // metadata
          m('.project-amount', `Total Funding: ${project.totalFunding}`),
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
