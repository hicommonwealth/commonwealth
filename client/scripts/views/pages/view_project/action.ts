import 'pages/commonwealth/projects.scss';

import { Card, Button } from 'construct-ui';
import m from 'mithril';

import { AnyProject } from 'views/components/project_card';




const ActionModule: m.Component<{project: AnyProject}, {}> = {
  view: (vnode) => {
    const { project } = vnode.attrs;
    return m('.col-lg-4 .action-area', [
      m('.action-title', [
        m('span.amount', `${project.totalFunding} / ${project.threadhold} `),
        m('span.coin', project.token)
      ]),
      m('.project-progress', [
        m('.project-progress-bar', [
          m('.project-progress-bar-fill', {
            style: `width: ${(100 * (project.totalFunding / project.threadhold)).toFixed(1)}%`
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