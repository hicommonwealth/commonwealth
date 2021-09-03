import 'components/commonwealth/project_card.scss';

import m from 'mithril';
import { Tag } from 'construct-ui';
import app from 'state';
import { CMNProject } from 'models';
import BN from 'bn.js';

const ProjectCard: m.Component<{project: CMNProject}> = {
  view: (vnode) => {
    const { project } = vnode.attrs;
    const bgColor = project.status === 'In Progress' ? 'blue' : (project.status === 'Successed') ? 'green' : 'red';
    const totalFunding = new BN(project.totalFunding.toString()).div(new BN(100000000)).toNumber();

    const displayText = project.withdrawIsDone
      ? `Withdraw is done. Total Funding was ${totalFunding} Ether`
      : `Total Funding: ${totalFunding} USD`;

    return m('.ProjectCard', [
      m('.project-card-top', {
        onclick: (e) => {
          e.stopPropagation();
          e.preventDefault();
          m.route.set(`/${app.activeChainId()}/project/${project.address}`); // avoid resetting scroll point
        },
      }, [
        m(Tag, {
          label: ['Project #', project.address.substring(0, 5)],
          intent: 'primary',
          rounded: true,
          size: 'xs',
          style: `background: ${bgColor}`
        }),
        m('.project-title', project.name),
        m('.project-display', displayText),
        m('.project-description', project.description),
      ]),

      m('.project-card-bottom', {
        onclick: (e) => {
          e.preventDefault();
        }
      }, [
        m('.no-linked-thread', 'No linked thread')
      ]),
    ]);
  }
};

export default ProjectCard;
