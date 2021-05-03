import 'pages/commonwealth/projects.scss';

import m from 'mithril';

import { AnyProject } from 'views/components/project_card';

const ProjectContentModule: m.Component<{project: AnyProject}, {}> = {
  view: (vnode) => {
    const { project } = vnode.attrs;
    return m('.col-lg-8 .content-area', [
      m('div.project-name', project.name),
      m('div.project-text', [
        m('span', 'A project by   '),
        m('span.bold', 'keith'),  // should be replaced with curator object
        m('span', '  : 3d 22h 42m left'),  // should be replaced with curator object
      ]),
      m('div.project-description', project.description)
    ]);
  }
}

export default ProjectContentModule;