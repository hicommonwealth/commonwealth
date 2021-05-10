import 'pages/commonwealth/projects.scss';

import { Button } from 'construct-ui';
import m from 'mithril';

import { CWProjectWithParticipants } from 'views/components/project_card';

const ActionModule: m.Component<{project: CWProjectWithParticipants}, {}> = {
  view: (vnode) => {
    const { project } = vnode.attrs;
    let percent = (100 * (project.totalFunding / project.threshold)).toFixed(1);
    if (parseInt(percent) > 100) {
      percent = '100';
    }
    return m('.col-lg-4 .action-area', [
      m('.action-title', [
        m('span.amount', `${project.totalFunding} / ${project.threshold} `),
        m('span.coin', project.acceptedToken === '0x01' ? 'Ether' : 'ERC20 Token')
      ]),
      m('.project-progress', [
        m('.project-progress-bar', [
          m('.project-progress-bar-fill', {
            style: `width: ${(100 * (project.totalFunding / project.threshold)).toFixed(1)}%`
          }),
        ]),
      ]),
      m('.project-funding-action', [
        m(Button, {
          class: 'contribute-button',
          label: 'Back with',
          rounded: true,
          fluid: true,
          intent: 'primary',
          onclick: (e) => {
            // TODO
          }
        }),
        m(Button, {
          class: 'contribute-button',
          label: 'Curate to receive success',
          rounded: true,
          fluid: true,
          intent: 'primary',
          onclick: (e) => {
            // TODO
          }
        }),
        m(Button, {
          class: 'contribute-button',
          label: 'Go to discussion thread ->',
          rounded: true,
          fluid: true,
          // intent: 'primary',
          onclick: (e) => {
            // TODO
          }
        }),
      ]),
    ]);
  }
}


export default ActionModule;