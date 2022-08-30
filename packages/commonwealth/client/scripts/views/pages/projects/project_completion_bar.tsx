/* @jsx m */

import 'pages/projects/project_completion_bar.scss';

import m from 'mithril';
import { ProjectStatus } from './types';

export default class ProjectCompletionBar
  implements
    m.ClassComponent<{
      completionPercent: number;
      projectStatus?: ProjectStatus;
    }>
{
  view(vnode) {
    const { completionPercent, projectStatus } = vnode.attrs;
    return (
      <div class="ProjectCompletionBar">
        <div
          class={`completed-percentage ${projectStatus}`}
          style={`width: ${completionPercent * 100}%`}
        />
      </div>
    );
  }
}
