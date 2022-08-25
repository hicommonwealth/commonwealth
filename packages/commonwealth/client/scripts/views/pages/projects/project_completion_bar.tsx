/* @jsx m */

import 'pages/projects/project_completion_bar.scss';

import m from 'mithril';

export default class ProjectCompletionBar
  implements
    m.ClassComponent<{
      completionPercent: number;
      projectStatus?: 'succeeded' | 'failed';
    }>
{
  view(vnode) {
    const { completionPercent, projectStatus } = vnode.attrs;
    console.log({ completionPercent });
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
