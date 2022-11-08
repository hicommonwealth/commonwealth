/* @jsx m */

import 'pages/projects/project_card.scss';

import m from 'mithril';
import { slugify } from 'utils';

import { Project } from 'models';
import { ProjectStatus } from '../types';
import CompletionBar from '../project_completion_bar';
import { HeaderPanel } from './header_panel';
import { InformationPanel } from './information_panel';

interface ProjectCardAttrs {
  project: Project;
  currentBlockNum: number;
}

export default class ProjectCard implements m.ClassComponent<ProjectCardAttrs> {
  view(vnode: m.Vnode<ProjectCardAttrs>) {
    const { project } = vnode.attrs;

    const projectStatus = project.succeededEvent
      ? ProjectStatus.Succeeded
      : project.failedEvent
      ? ProjectStatus.Failed
      : ProjectStatus.Active;

    const onclick = () => {
      m.route.set(`project/${project.id}-${slugify(project.title)}`);
    };

    return (
      <div class="ProjectCard large" onclick={onclick}>
        <HeaderPanel project={project} />
        <CompletionBar
          completionPercent={project.completionPercent}
          projectStatus={projectStatus}
        />
        <InformationPanel project={project} projectStatus={projectStatus} />
      </div>
    );
  }
}
